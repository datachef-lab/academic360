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
  receiptTypeModel,
  feeCategoryModel,
} from "@repo/db/schemas";
import { and, asc, eq, sql } from "drizzle-orm";
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
  toSentenceCasePreservingTrailingRoman,
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

/** DB lookup key for receipt_number (aligned with fee payment marking). */
export function normalizeReceiptLookupKey(input: string): string {
  return String(input || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "/")
    .replace(/\/+/g, "/")
    .toUpperCase();
}

/**
 * First-time receipt download: assigns receipt_number and challan_generated_at.
 * If receipt_number exists but challan_generated_at is missing (legacy), sets timestamp once.
 */
/**
 * After a fee payment succeeds (including online): assign receipt/challan number and
 * `challan_generated_at` if missing — same as first PDF download, but automatic.
 * Idempotent; safe to call on duplicate callbacks.
 */
export async function issueFeeStudentMappingReceiptIfMissing(
  feeStudentMappingId: number,
): Promise<void> {
  const [row] = await db
    .select({
      mappingId: feeStudentMappingModel.id,
      receiptNumber: feeStudentMappingModel.receiptNumber,
      challanGeneratedAt: feeStudentMappingModel.challanGeneratedAt,
      uid: studentModel.uid,
      feeCategoryCode: feeCategoryModel.code,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      studentModel,
      eq(studentModel.id, feeStudentMappingModel.studentId),
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
    .leftJoin(
      feeCategoryModel,
      eq(feeCategoryModel.id, feeGroupModel.feeCategoryId),
    )
    .where(eq(feeStudentMappingModel.id, feeStudentMappingId))
    .limit(1);

  if (!row) return;

  await persistReceiptIssuanceIfNeeded({
    mappingId: row.mappingId,
    existingReceiptNumber: row.receiptNumber,
    existingChallanGeneratedAt: row.challanGeneratedAt,
    studentUid: row.uid,
    feeCategoryCode: row.feeCategoryCode,
  });
}

async function persistReceiptIssuanceIfNeeded(params: {
  mappingId: number;
  existingReceiptNumber: string | null | undefined;
  existingChallanGeneratedAt: Date | null | undefined;
  studentUid: string;
  feeCategoryCode: string | null | undefined;
}): Promise<{ challanNumber: string; challanGeneratedAt: Date }> {
  const { mappingId, studentUid, feeCategoryCode } = params;
  const existingRn = params.existingReceiptNumber?.trim() || "";

  if (existingRn) {
    let cg = params.existingChallanGeneratedAt ?? null;
    if (!cg) {
      const now = new Date();
      await db
        .update(feeStudentMappingModel)
        .set({ challanGeneratedAt: now })
        .where(eq(feeStudentMappingModel.id, mappingId));
      cg = now;
    }
    return { challanNumber: existingRn, challanGeneratedAt: cg };
  }

  const nextReceiptNum = await getNextReceiptNumberForUid(studentUid);
  const challanNumber = feeCategoryCode
    ? `${studentUid}/${nextReceiptNum}-${feeCategoryCode}`
    : `${studentUid}/${nextReceiptNum}`;
  const now = new Date();
  await db
    .update(feeStudentMappingModel)
    .set({
      receiptNumber: challanNumber,
      challanGeneratedAt: now,
    })
    .where(eq(feeStudentMappingModel.id, mappingId));

  return { challanNumber, challanGeneratedAt: now };
}

async function fetchFeeReceiptJoinRow(
  feeStructureId: number,
  studentId: number,
) {
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
      payment: paymentModel,
      feeCategoryCode: feeCategoryModel.code,
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
    .leftJoin(
      paymentModel,
      and(
        eq(paymentModel.id, feeStudentMappingModel.paymentId),
        eq(paymentModel.status, "SUCCESS"),
      ),
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
    .leftJoin(
      feeCategoryModel,
      eq(feeCategoryModel.id, feeGroupModel.feeCategoryId),
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

  return result[0] ?? null;
}

/**
 * Gets the next receipt number for a given student UID.
 * Finds all existing receipt numbers starting with the UID, extracts the numeric part,
 * and returns the next incremented number (zero-padded to 2 digits).
 */
export async function getNextReceiptNumberForUid(uid: string): Promise<string> {
  try {
    const escapedUid = uid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Find all existing receipt numbers for this UID.
    // Supports both legacy format: uid/NN
    // and current format: uid/NN-CODE
    const { rows } = await db.execute(sql`
      SELECT receipt_number
      FROM public.fee_student_mappings
      WHERE receipt_number ~ ${`^${escapedUid}/\\d+([-/].*)?$`}
    `);

    let maxNum = 0;
    for (const row of rows ?? []) {
      const rn = (row as { receipt_number?: unknown })?.receipt_number;
      if (typeof rn !== "string") continue;
      const m = rn.match(new RegExp(`^${escapedUid}/(\\d+)`));
      if (!m) continue;
      const n = Number.parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxNum) {
        maxNum = n;
      }
    }

    return String(maxNum + 1).padStart(2, "0");
  } catch (error) {
    console.warn(
      `[FEE_SERVICE] Error getting next receipt number for UID ${uid}:`,
      error,
    );
    // Fallback to "01" on error
    return "01";
  }
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
        ? "SUCCESS"
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
    .where(eq(feeStudentMappingModel.studentId, studentId))
    .orderBy(asc(feeStudentMappingModel.id));

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
  });
}

/** POST /fees/receipts — ensure receipt/challan row exists; returns relative URL for GET PDF. */
export async function ensureFeeReceiptChallanUrl(
  feeStructureId: number,
  studentId: number,
): Promise<{ url: string; challanNumber: string } | null> {
  if (!feeStructureId || !studentId) return null;
  const row = await fetchFeeReceiptJoinRow(feeStructureId, studentId);
  if (!row) return null;

  const { challanNumber } = await persistReceiptIssuanceIfNeeded({
    mappingId: row.feeStudentMapping.id,
    existingReceiptNumber: row.feeStudentMapping.receiptNumber,
    existingChallanGeneratedAt: row.feeStudentMapping.challanGeneratedAt,
    studentUid: row.student.uid,
    feeCategoryCode: row.feeCategoryCode,
  });

  const url = `/api/v1/fees/receipts?challanNumber=${challanNumber}`;
  return { url, challanNumber };
}

/** GET /fees/receipts?challanNumber= — generate PDF by challan / receipt number. */
export async function generateFeeReceiptByChallanNumber(
  challanNumberRaw: string,
) {
  const key = normalizeReceiptLookupKey(challanNumberRaw);
  if (!key) return null;

  const { rows } = await db.execute<{
    studentId: number;
    feeStructureId: number;
  }>(sql`
    SELECT student_id_fk AS "studentId", fee_structure_id_fk AS "feeStructureId"
    FROM public.fee_student_mappings
    WHERE upper(replace(trim(receipt_number), '-', '/')) = ${key}
    LIMIT 1
  `);

  const r = rows[0];
  if (!r) return null;

  return generateFeeReceiptByFeeStructureIdAndStudentId(
    Number(r.feeStructureId),
    Number(r.studentId),
  );
}

async function generateFeeReceiptInternal(params: {
  feeStructureId: number;
  studentId: number;
}) {
  const { feeStructureId, studentId } = params;
  if (!feeStructureId || !studentId) {
    throw Error("feeStructureId or studentId is not valid");
  }

  const joinRow = await fetchFeeReceiptJoinRow(feeStructureId, studentId);
  if (!joinRow) {
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
    payment,
    receiptType,
    feeCategoryCode,
  } = joinRow;

  const { challanNumber, challanGeneratedAt } =
    await persistReceiptIssuanceIfNeeded({
      mappingId: feeStudentMapping.id,
      existingReceiptNumber: feeStudentMapping.receiptNumber,
      existingChallanGeneratedAt: feeStudentMapping.challanGeneratedAt,
      studentUid: student.uid,
      feeCategoryCode: feeCategoryCode,
    });

  const semesterName = toSentenceCasePreservingTrailingRoman(classRecord.name);

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
          amount: formatIndianNumber(component.amount!).toString(),
          name: feeHead?.name || "Unknown",
        };
      }),
  );

  const pageTitle = `${student.uid} | ${receiptType.name} - ${semesterName} | ${programCourse.name} (${session.name})`;

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
    isPaid: payment?.status === "SUCCESS",
    mode: ePaid ? "online" : "offline",
    paidDate: payment?.txnDate
      ? new Date(payment.txnDate).toLocaleDateString("en-GB")
      : "",
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
