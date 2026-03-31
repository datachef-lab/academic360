import { db } from "@/db";
import {
  feeStudentMappingModel,
  createFeeStudentMappingSchema,
  feeStructureModel,
  feeGroupPromotionMappingModel,
  feeGroupModel,
  paymentModel,
  studentModel,
  academicYearModel,
  sessionModel,
  userModel,
  personalDetailsModel,
  classModel,
  programCourseModel,
  shiftModel,
  feeStructureComponentModel,
  feeHeadModel,
  receiptTypeModel,
} from "@repo/db/schemas";
import { and, eq, sql } from "drizzle-orm";
import { FeeStudentMappingDto } from "@repo/db/dtos/fees";
import { socketService } from "@/services/socketService.js";
import * as feeStructureService from "./fee-structure.service.js";
import * as feeGroupPromotionMappingService from "./fee-group-promotion-mapping.service.js";
import * as feeStructureInstallmentService from "./fee-structure-installment.service.js";
import * as feeHeadService from "./fee-head.service.js";
import * as userService from "@/features/user/services/user.service.js";
import { pdfGenerationService } from "@/services/pdf-generation.service.js";
import {
  formatIndianNumber,
  numberToWords,
  toSentenceCase,
} from "@/utils/helper.js";

/**
 * Normalizes a challan number for lookup. Barcodes encode slash as hyphen for
 * scanner compatibility; this converts back to canonical "uid/semNum" form.
 * Use when processing scanned barcode values (e.g. fee update by challan).
 */
export function normalizeChallanNumber(scanned: string): string {
  if (!scanned || typeof scanned !== "string") return scanned;
  return scanned.trim().replace(/-/g, "/");
}

/**
 * Converts a FeeStudentMapping model to FeeStudentMappingDto
 */
async function modelToDto(
  model: typeof feeStudentMappingModel.$inferSelect | null,
): Promise<FeeStudentMappingDto | null> {
  if (!model) return null;

  const [payment] = model.paymentId
    ? await db
        .select({
          status: paymentModel.status,
          txnDate: paymentModel.txnDate,
          updatedAt: paymentModel.updatedAt,
        })
        .from(paymentModel)
        .where(eq(paymentModel.id, model.paymentId))
    : [null];

  const [
    feeStructure,
    feeGroupPromotionMapping,
    feeStructureInstallment,
    waivedOffByUser,
  ] = await Promise.all([
    feeStructureService.getFeeStructureById(model.feeStructureId),
    feeGroupPromotionMappingService.getFeeGroupPromotionMappingById(
      model.feeGroupPromotionMappingId,
    ),
    model.feeStructureInstallmentId
      ? feeStructureInstallmentService.getFeeStructureInstallmentById(
          model.feeStructureInstallmentId,
        )
      : Promise.resolve(null),
    model.waivedOffByUserId
      ? userService.findById(model.waivedOffByUserId)
      : Promise.resolve(null),
  ]);

  if (!feeStructure || !feeGroupPromotionMapping) {
    return null;
  }

  // Get all fee group promotion mappings for this fee structure
  // This might need to be adjusted based on your business logic
  const feeGroupPromotionMappings = [feeGroupPromotionMapping];

  const totalPayable = model.totalPayable ?? 0;
  const amountPaid = model.amountPaid ?? 0;
  const paymentStatus: FeeStudentMappingDto["paymentStatus"] =
    payment?.status === "FAILED"
      ? "FAILED"
      : totalPayable > 0 && amountPaid >= totalPayable
        ? "COMPLETED"
        : "PENDING";

  const transactionDate: FeeStudentMappingDto["transactionDate"] =
    (payment as { txnDate?: string | null } | null)?.txnDate ??
    (payment as { updatedAt?: Date | string | null } | null)?.updatedAt ??
    null;

  return {
    ...model,
    feeStructure,
    feeGroupPromotionMappings,
    feeStructureInstallment,
    waivedOffByUser,
    paymentStatus,
    transactionDate,
  };
}

const emitFeeStudentMappingUpdate = async (studentId: number) => {
  try {
    const io = socketService.getIO();
    if (!io) return;
    const [student] = await db
      .select({ userId: studentModel.userId })
      .from(studentModel)
      .where(eq(studentModel.id, studentId));
    if (student?.userId) {
      io.to(`user:${student.userId}`).emit("fee_student_mapping_updated", {
        studentId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    // non-critical
  }
};

/**
 * Services should accept validated DTOs (controller validates via zod) and
 * return raw rows / arrays / null. Do not catch errors here — controller will handle them.
 */
export const createFeeStudentMapping = async (
  data: typeof createFeeStudentMappingSchema._type,
): Promise<FeeStudentMappingDto> => {
  const [created] = await db
    .insert(feeStudentMappingModel)
    .values(data)
    .returning();

  const dto = await modelToDto(created);
  emitFeeStudentMappingUpdate(created.studentId);
  return dto!;
};

export const getAllFeeStudentMappings = async (): Promise<
  FeeStudentMappingDto[]
> => {
  const rows = await db.select().from(feeStudentMappingModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is FeeStudentMappingDto => dto !== null);
};

export const getFeeStudentMappingById = async (
  id: number,
): Promise<FeeStudentMappingDto | null> => {
  const [row] = await db
    .select()
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.id, id));

  return await modelToDto(row ?? null);
};

export const getFeeStudentMappingsByStudentId = async (
  studentId: number,
): Promise<FeeStudentMappingDto[]> => {
  const rows = await db
    .select()
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.studentId, studentId));

  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is FeeStudentMappingDto => dto !== null);
};

export const updateFeeStudentMapping = async (
  id: number,
  data: Partial<typeof createFeeStudentMappingSchema._type>,
): Promise<FeeStudentMappingDto | null> => {
  // Get the existing mapping to calculate totalPayable if waived off details are being updated
  const [existing] = await db
    .select()
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.id, id));

  if (!existing) {
    return null;
  }

  // If waived off details are being updated, recalculate totalPayable
  if (data.isWaivedOff !== undefined || data.waivedOffAmount !== undefined) {
    // Get fee structure and fee group promotion mapping to calculate base totalPayable
    const [feeStructure] = await db
      .select()
      .from(feeStructureModel)
      .where(eq(feeStructureModel.id, existing.feeStructureId));

    const [feeGroupPromotionMapping] = await db
      .select()
      .from(feeGroupPromotionMappingModel)
      .where(
        eq(
          feeGroupPromotionMappingModel.id,
          existing.feeGroupPromotionMappingId,
        ),
      );

    if (feeStructure && feeGroupPromotionMapping) {
      // Calculate base totalPayable (after concession, before waiver) using the service function
      const baseTotalPayable =
        await feeStructureService.calculateTotalPayableForFeeStudentMapping(
          existing.feeStructureId,
          feeGroupPromotionMapping,
        );

      // Determine waived off amount: use new value if provided, otherwise use existing value
      const isWaivedOff =
        data.isWaivedOff !== undefined
          ? data.isWaivedOff
          : existing.isWaivedOff;
      const waivedOffAmount = isWaivedOff
        ? data.waivedOffAmount !== undefined
          ? data.waivedOffAmount
          : existing.waivedOffAmount
        : 0;

      // Apply waived off amount: baseTotalPayable (after concession) - waivedOffAmount
      // This ensures waiver is deducted from the amount after concession is applied
      const finalTotalPayable = Math.max(0, baseTotalPayable - waivedOffAmount);

      data.totalPayable = finalTotalPayable;
    }
  }

  const [updated] = await db
    .update(feeStudentMappingModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(feeStudentMappingModel.id, id))
    .returning();

  if (updated) emitFeeStudentMappingUpdate(updated.studentId);
  return await modelToDto(updated ?? null);
};

export const deleteFeeStudentMapping = async (
  id: number,
): Promise<FeeStudentMappingDto | null> => {
  const [deleted] = await db
    .delete(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.id, id))
    .returning();

  return await modelToDto(deleted ?? null);
};

export async function generateFeeReceiptByFeeStructureIdAndStudentId(
  feeStructureId: number,
  studentId: number,
) {
  return generateFeeReceiptInternal({
    feeStructureId,
    studentId,
    offline: false,
  });
}

export async function generateFeeReceiptOfflineByFeeStructureIdAndStudentId(
  feeStructureId: number,
  studentId: number,
): Promise<Awaited<ReturnType<typeof generateFeeReceiptInternal>>> {
  return generateFeeReceiptInternal({
    feeStructureId,
    studentId,
    offline: true,
  });
}

async function generateFeeReceiptInternal(params: {
  feeStructureId: number;
  studentId: number;
  offline: boolean;
}) {
  const { feeStructureId, studentId, offline } = params;
  if (!feeStructureId || !studentId) {
    throw Error("feeStructureId or studentId is not valid");
  }

  // Fetch all data with joins
  const result = await db
    .select({
      feeStudentMapping: feeStudentMappingModel,
      feeStructure: feeStructureModel,
      student: studentModel,
      user: userModel,
      personalDetails: personalDetailsModel,
      session: sessionModel,
      feeGroup: feeGroupModel,
      academicYear: academicYearModel,
      class: classModel,
      shift: shiftModel,
      programCourse: programCourseModel,
      receiptType: receiptTypeModel,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .innerJoin(
      studentModel,
      eq(studentModel.id, feeStudentMappingModel.studentId),
    )
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, userModel.id),
    )
    .innerJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .innerJoin(
      feeGroupModel,
      eq(feeGroupModel.id, feeGroupPromotionMappingModel.feeGroupId),
    )
    .innerJoin(
      academicYearModel,
      eq(academicYearModel.id, feeStructureModel.academicYearId),
    )
    .innerJoin(
      sessionModel,
      eq(sessionModel.academicYearId, academicYearModel.id),
    )
    .innerJoin(classModel, eq(classModel.id, feeStructureModel.classId))
    .innerJoin(shiftModel, eq(shiftModel.id, feeStructureModel.shiftId))
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, feeStructureModel.programCourseId),
    )
    .innerJoin(
      receiptTypeModel,
      eq(receiptTypeModel.id, feeStructureModel.receiptTypeId),
    )
    .where(
      and(
        eq(feeStudentMappingModel.studentId, studentId),
        eq(feeStudentMappingModel.feeStructureId, feeStructureId),
      ),
    );

  if (!result.length) {
    return null;
  }

  const {
    feeStudentMapping,
    feeStructure,
    student,
    user,
    personalDetails,
    session,
    feeGroup,
    class: classRecord,
    shift,
    programCourse,
    receiptType,
  } = result[0];

  // Fetch fee structure components and filter by student's assigned slab
  const components = await db
    .select()
    .from(feeStructureComponentModel)
    .where(eq(feeStructureComponentModel.feeStructureId, feeStructure.id));

  const componentDtos: Array<{
    amount: string;
    name: string;
  }> = await Promise.all(
    components
      .filter((component) => component.feeSlabId === feeGroup.feeSlabId)
      .map(async (component) => {
        const feeHead = await feeHeadService.getFeeHeadById(
          component.feeHeadId,
        );
        return {
          amount: component.amount!.toString(),
          name: feeHead?.name || "Unknown",
        };
      }),
  );

  // Generate challan number
  const romanMap: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
  };

  const semesterName = toSentenceCase(classRecord.name);
  const semRoman = semesterName.replace("Semester ", "");
  const semIndex = romanMap[semRoman];
  const semNum =
    typeof semIndex === "number" ? String(semIndex).padStart(2, "0") : semRoman;

  const challanNumber = `${student.uid}/${semNum}`;

  // Set challanGeneratedAt once (immutable) — persist if not already set
  let challanGeneratedAt = feeStudentMapping.challanGeneratedAt;
  if (!challanGeneratedAt) {
    challanGeneratedAt = new Date();
    // Persist using snake_case DB columns (avoid changing model column mapping).
    await db.execute(sql`
      UPDATE public.fee_student_mappings
      SET challan_generated_at = ${challanGeneratedAt}
      WHERE id = ${feeStudentMapping.id}
        AND challan_generated_at IS NULL
    `);
  }

  // Offline receipt: also persist receipt_number as `uid/semesterNumber` (once).
  if (offline) {
    await db.execute(sql`
      UPDATE public.fee_student_mappings
      SET receipt_number = ${challanNumber}
      WHERE id = ${feeStudentMapping.id}
        AND (receipt_number IS NULL OR trim(receipt_number) = '')
    `);
  }

  const pageTitle = `${student.uid} | ${receiptType.name} - ${semesterName} | ${programCourse.name} (${session.name})`;

  // Optional: For successful ONLINE payments, show ePAID metadata block in PDF.
  const ePaid = await (async () => {
    const paymentId = feeStudentMapping.paymentId;
    if (!paymentId) return null;
    const [pay] = await db
      .select({
        status: paymentModel.status,
        paymentMode: paymentModel.paymentMode,
        orderId: paymentModel.orderId,
        txnDate: paymentModel.txnDate,
      })
      .from(paymentModel)
      .where(eq(paymentModel.id, paymentId));
    const isSuccess = String(pay?.status || "").toUpperCase() === "SUCCESS";
    const isOnline = String(pay?.paymentMode || "").toUpperCase() === "ONLINE";
    const orderId = String(pay?.orderId || "").trim();
    const txnDateRaw = String(pay?.txnDate || "").trim();
    if (!isSuccess || !isOnline || !orderId || !txnDateRaw) return null;

    const d = new Date(txnDateRaw);
    const transactionDate = Number.isFinite(d.getTime())
      ? d.toLocaleDateString("en-GB")
      : "";
    if (!transactionDate) return null;
    return { orderId, transactionDate };
  })();

  // Generate PDF buffer
  const pdfBuffer = await pdfGenerationService.generateFeeReceiptPdfBuffer({
    session: session.name,
    name: user.name,
    dob: personalDetails?.dateOfBirth
      ? new Date(personalDetails.dateOfBirth).toLocaleDateString("en-GB")
      : "",
    phone: user.phone ?? "",
    programCourse: programCourse.name ?? "",
    semester: semesterName,
    shift: shift.name ?? "",
    uid: student.uid,
    totalPayableAmount: formatIndianNumber(feeStudentMapping.totalPayable),
    totalPayableAmountInWords: numberToWords(feeStudentMapping.totalPayable),
    challanNumber,
    challanDate: challanGeneratedAt.toLocaleDateString("en-GB"),
    ePaid,
    feeComponents: componentDtos,
    pageTitle,
  });

  return {
    pdfBuffer,
    session: session.name,
    semester: semesterName,
    programCourse: programCourse.name,
    receiptName: receiptType.name,
    uid: student.uid,
  };
}
