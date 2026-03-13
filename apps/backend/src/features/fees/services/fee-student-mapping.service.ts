import { db } from "@/db";
import {
  feeStudentMappingModel,
  createFeeStudentMappingSchema,
  feeStructureModel,
  feeGroupPromotionMappingModel,
  feeGroupModel,
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
import { and, asc, eq } from "drizzle-orm";
import { FeeStudentMappingDto } from "@repo/db/dtos/fees";
import * as feeStructureService from "./fee-structure.service.js";
import * as feeGroupPromotionMappingService from "./fee-group-promotion-mapping.service.js";
import * as feeStructureInstallmentService from "./fee-structure-installment.service.js";
import * as userService from "@/features/user/services/user.service.js";
import { pdfGenerationService } from "@/services/pdf-generation.service.js";
import { formatIndianNumber, numberToWords } from "@/utils/helper.js";

/**
 * Converts a FeeStudentMapping model to FeeStudentMappingDto
 */
async function modelToDto(
  model: typeof feeStudentMappingModel.$inferSelect | null,
): Promise<FeeStudentMappingDto | null> {
  if (!model) return null;

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

  return {
    ...model,
    feeStructure,
    feeGroupPromotionMappings,
    feeStructureInstallment,
    waivedOffByUser,
  };
}

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
  console.log(feeStructureId, studentId);
  if (!feeStructureId || !studentId) {
    throw Error("feeStructureId or studentId is not valid");
  }

  const result = await db
    .select({
      receiptName: receiptTypeModel.name,
      session: sessionModel.name,
      name: userModel.name,
      uid: studentModel.uid,
      dob: personalDetailsModel.dateOfBirth,
      phone: userModel.phone,
      semester: classModel.name,
      programCourse: programCourseModel.name,
      shift: shiftModel.name,
      feeHead: feeHeadModel.name,
      feeComponentAmount: feeStructureComponentModel.amount,
      totalPayableAmount: feeStudentMappingModel.totalPayable,
    })
    .from(feeStudentMappingModel)
    .leftJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .leftJoin(
      academicYearModel,
      eq(academicYearModel.id, feeStructureModel.academicYearId),
    )
    .leftJoin(
      sessionModel,
      eq(sessionModel.academicYearId, academicYearModel.id),
    )
    .leftJoin(
      studentModel,
      eq(studentModel.id, feeStudentMappingModel.studentId),
    )
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, userModel.id),
    )
    .leftJoin(classModel, eq(classModel.id, feeStructureModel.classId))
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, feeStructureModel.programCourseId),
    )
    .leftJoin(shiftModel, eq(shiftModel.id, feeStructureModel.shiftId))
    .leftJoin(
      feeStructureComponentModel,
      eq(feeStructureComponentModel.feeStructureId, feeStructureModel.id),
    )
    .leftJoin(
      feeHeadModel,
      eq(feeHeadModel.id, feeStructureComponentModel.feeHeadId),
    )
    .leftJoin(
      receiptTypeModel,
      eq(receiptTypeModel.id, feeStructureModel.receiptTypeId),
    )
    .where(
      and(
        eq(feeStudentMappingModel.studentId, studentId),
        eq(feeStudentMappingModel.feeStructureId, feeStructureId),
      ),
    )
    .orderBy(asc(feeStructureComponentModel.id));

  if (!result.length) {
    return null;
  }

  const pdfBuffer = await pdfGenerationService.generateFeeReceiptPdfBuffer({
    session: result[0].session!,
    name: result[0].name!,
    dob: result[0].dob ?? "",
    phone: result[0].phone ?? "",
    programCourse: result[0].programCourse!,
    semester: result[0].semester!,
    shift: result[0].shift!,
    uid: result[0].uid!,
    totalPayableAmount: formatIndianNumber(result[0].totalPayableAmount),
    totalPayableAmountInWords: numberToWords(result[0].totalPayableAmount),
    challanNumber: "N/A",
    feeComponents: result.map((fc) => ({
      amount: fc.feeComponentAmount!.toString(),
      name: fc.feeHead!.toString(),
    })),
  });

  const { session, semester, programCourse, receiptName, uid } = result[0];

  return { pdfBuffer, session, semester, programCourse, receiptName, uid };
}
