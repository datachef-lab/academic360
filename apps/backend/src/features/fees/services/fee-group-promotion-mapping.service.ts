import { db } from "@/db";
import {
  feeGroupPromotionMappingModel,
  createFeeGroupPromotionMappingSchema,
  feeGroupModel,
  feeCategoryModel,
  feeSlabModel,
  promotionModel,
  boardResultStatusModel,
  paymentModel,
} from "@repo/db/schemas";
import { promotionStatusModel } from "@repo/db/schemas/models/batches";
import {
  sessionModel,
  classModel,
  sectionModel,
  shiftModel,
  academicYearModel,
} from "@repo/db/schemas/models/academics";
import {
  studentModel,
  personalDetailsModel,
} from "@repo/db/schemas/models/user";
import { and, inArray, desc, eq } from "drizzle-orm";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import {
  feeStructureModel,
  feeStructureComponentModel,
} from "@repo/db/schemas";
import XLSX from "xlsx";
import fs from "fs";
import * as studentService from "@/features/user/services/student.service.js";
import { socketService } from "@/services/socketService.js";
import { feeStudentMappingModel } from "@repo/db/schemas";
import { FeeGroupPromotionMappingDto } from "@repo/db/dtos/fees";
import { PromotionDto } from "@repo/db/dtos/batches";
import {
  religionModel,
  categoryModel,
} from "@repo/db/schemas/models/resources";
import * as programCourseService from "@/features/course-design/services/program-course.service.js";
import * as userService from "@/features/user/services/user.service.js";

/**
 * Converts a Promotion model to PromotionDto
 */
async function promotionToDto(
  promotion: typeof promotionModel.$inferSelect | null,
): Promise<PromotionDto | null> {
  if (!promotion) return null;

  const [
    promStatus,
    boardResStatus,
    sess,
    cls,
    sec,
    shf,
    progCourse,
    studentWithDetails,
  ] = await Promise.all([
    db
      .select()
      .from(promotionStatusModel)
      .where(eq(promotionStatusModel.id, promotion.promotionStatusId))
      .then((r) => r[0] ?? null),
    promotion.boardResultStatusId
      ? db
          .select()
          .from(boardResultStatusModel)
          .where(eq(boardResultStatusModel.id, promotion.boardResultStatusId))
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db
      .select()
      .from(sessionModel)
      .where(eq(sessionModel.id, promotion.sessionId))
      .then(async (r) => {
        const session = r[0] ?? null;
        if (session && session.academicYearId) {
          const [academicYear] = await db
            .select()
            .from(academicYearModel)
            .where(eq(academicYearModel.id, session.academicYearId));

          return {
            ...session,
            academicYear: academicYear || null,
          };
        }
        return session;
      }),
    db
      .select()
      .from(classModel)
      .where(eq(classModel.id, promotion.classId))
      .then((r) => r[0] ?? null),
    promotion.sectionId
      ? db
          .select()
          .from(sectionModel)
          .where(eq(sectionModel.id, promotion.sectionId))
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db
      .select()
      .from(shiftModel)
      .where(eq(shiftModel.id, promotion.shiftId))
      .then((r) => r[0] ?? null),
    programCourseService.findById(promotion.programCourseId),
    // Student + personal details (for name, UID, religion, category, community)
    db
      .select({
        uid: studentModel.uid,
        community: studentModel.community,
        firstName: personalDetailsModel.firstName,
        middleName: personalDetailsModel.middleName,
        lastName: personalDetailsModel.lastName,
        religionName: religionModel.name,
        categoryName: categoryModel.name,
      })
      .from(studentModel)
      .leftJoin(
        personalDetailsModel,
        eq(personalDetailsModel.userId, studentModel.userId),
      )
      .leftJoin(
        religionModel,
        eq(religionModel.id, personalDetailsModel.religionId),
      )
      .leftJoin(
        categoryModel,
        eq(categoryModel.id, personalDetailsModel.categoryId),
      )
      .where(eq(studentModel.id, promotion.studentId))
      .then((r) => r[0] ?? null),
  ]);

  // Section can be optional; allow promotions without a section.
  if (!promStatus || !sess || !cls || !shf || !progCourse) {
    return null;
  }

  const fullName = studentWithDetails
    ? [
        studentWithDetails.firstName,
        studentWithDetails.middleName,
        studentWithDetails.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  return {
    id: promotion.id,
    legacyHistoricalRecordId: promotion.legacyHistoricalRecordId ?? null,
    studentId: promotion.studentId,
    isAlumni: promotion.isAlumni,
    dateOfJoining: promotion.dateOfJoining,
    classRollNumber: promotion.classRollNumber,
    rollNumber: promotion.rollNumber ?? null,
    rollNumberSI: promotion.rollNumberSI ?? null,
    examNumber: promotion.examNumber ?? null,
    examSerialNumber: promotion.examSerialNumber ?? null,
    startDate: promotion.startDate ?? null,
    endDate: promotion.endDate ?? null,
    remarks: promotion.remarks ?? null,
    createdAt: promotion.createdAt ?? new Date(),
    updatedAt: promotion.updatedAt ?? new Date(),
    promotionStatus: promStatus,
    boardResultStatus: boardResStatus!,
    session: sess,
    class: cls,
    section: sec,
    shift: shf,
    programCourse: progCourse!,
    // Extra display fields used on the frontend table
    // (these extend PromotionDto structurally)
    studentName: fullName,
    uid: studentWithDetails?.uid ?? null,
    religionName: studentWithDetails?.religionName ?? null,
    categoryName: studentWithDetails?.categoryName ?? null,
    communityName: studentWithDetails?.community ?? null,
    academicYearName:
      // Prefer academic year name if available on session
      (sess as any)?.academicYear?.year ?? null,
  } as PromotionDto & {
    studentName?: string | null;
    uid?: string | null;
    religionName?: string | null;
    categoryName?: string | null;
    communityName?: string | null;
    academicYearName?: string | null;
  };
}

/**
 * Converts a FeeGroupPromotionMapping model to FeeGroupPromotionMappingDto
 */
async function modelToDto(
  model: typeof feeGroupPromotionMappingModel.$inferSelect | null,
): Promise<FeeGroupPromotionMappingDto | null> {
  if (!model) return null;

  const [feeGroup, promotion] = await Promise.all([
    db
      .select()
      .from(feeGroupModel)
      .where(eq(feeGroupModel.id, model.feeGroupId))
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(promotionModel)
      .where(eq(promotionModel.id, model.promotionId))
      .then((r) => r[0] ?? null),
  ]);

  if (!feeGroup || !promotion) {
    return null;
  }

  // Fetch feeCategory and feeSlab for the feeGroup
  const [feeCategory, feeSlab] = await Promise.all([
    db
      .select()
      .from(feeCategoryModel)
      .where(eq(feeCategoryModel.id, feeGroup.feeCategoryId))
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(feeSlabModel)
      .where(eq(feeSlabModel.id, feeGroup.feeSlabId))
      .then((r) => r[0] ?? null),
  ]);

  if (!feeCategory || !feeSlab) {
    return null;
  }

  const promotionDto = await promotionToDto(promotion);
  if (!promotionDto) {
    return null;
  }

  return {
    ...model,
    feeGroup: {
      ...feeGroup,
      feeCategory,
      feeSlab,
    },
    promotion: promotionDto,
  };
}

/**
 * Services should accept validated DTOs (controller validates via zod) and
 * return raw rows / arrays / null. Do not catch errors here — controller will handle them.
 */
export const createFeeGroupPromotionMapping = async (
  data: Omit<
    typeof createFeeGroupPromotionMappingSchema._type,
    "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
  >,
  userId: number,
): Promise<FeeGroupPromotionMappingDto> => {
  const [created] = await db
    .insert(feeGroupPromotionMappingModel)
    .values({
      ...data,
    })
    .returning();

  const dto = await modelToDto(created);

  // Emit socket event for fee group promotion mapping creation
  const io = socketService.getIO();
  if (io && dto) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_group_promotion_mapping_created", {
      mappingId: dto.id,
      type: "creation",
      message: "A new student fee group mapping has been created",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_group_promotion_mapping_created_${dto.id}_${Date.now()}`,
      type: "info",
      userId: userId.toString(),
      userName,
      message: `created a new student fee group mapping (ID: ${dto.id})`,
      createdAt: new Date(),
      read: false,
      meta: { mappingId: dto.id, type: "creation" },
    });
  }

  return dto!;
};

export const getAllFeeGroupPromotionMappings = async (
  limit: number = 10000,
): Promise<FeeGroupPromotionMappingDto[]> => {
  // Order by id DESC to maintain consistent ordering (updated items stay in place)
  const rows = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .orderBy(desc(feeGroupPromotionMappingModel.id))
    .limit(limit);

  // Batch fetch fee groups and promotions to reduce queries
  const feeGroupIds = [...new Set(rows.map((r) => r.feeGroupId))];
  const promotionIds = [...new Set(rows.map((r) => r.promotionId))];

  const [feeGroups, promotions] = await Promise.all([
    feeGroupIds.length > 0
      ? db
          .select()
          .from(feeGroupModel)
          .where(inArray(feeGroupModel.id, feeGroupIds))
      : Promise.resolve([]),
    promotionIds.length > 0
      ? db
          .select()
          .from(promotionModel)
          .where(inArray(promotionModel.id, promotionIds))
      : Promise.resolve([]),
  ]);

  const feeGroupMap = new Map(feeGroups.map((fg) => [fg.id, fg]));

  // Batch fetch fee categories and slabs
  const feeCategoryIds = [...new Set(feeGroups.map((fg) => fg.feeCategoryId))];
  const feeSlabIds = [...new Set(feeGroups.map((fg) => fg.feeSlabId))];

  const [feeCategories, feeSlabs] = await Promise.all([
    feeCategoryIds.length > 0
      ? db
          .select()
          .from(feeCategoryModel)
          .where(inArray(feeCategoryModel.id, feeCategoryIds))
      : Promise.resolve([]),
    feeSlabIds.length > 0
      ? db
          .select()
          .from(feeSlabModel)
          .where(inArray(feeSlabModel.id, feeSlabIds))
      : Promise.resolve([]),
  ]);

  const feeCategoryMap = new Map(feeCategories.map((fc) => [fc.id, fc]));
  const feeSlabMap = new Map(feeSlabs.map((fs) => [fs.id, fs]));

  // Batch fetch all promotion-related data
  const promotionDtos = await Promise.all(
    promotions.map((p) => promotionToDto(p)),
  );
  const promotionDtoMap = new Map(
    promotionDtos
      .filter((pd): pd is PromotionDto => pd !== null)
      .map((pd) => [pd.id!, pd]),
  );

  // Batch fetch fee student mappings for payment status and amount to pay
  const mappingIds = rows
    .map((r) => r.id)
    .filter((id): id is number => id != null);
  const feeStudentMappings =
    mappingIds.length > 0
      ? await db
          .select({
            feeGroupPromotionMappingId:
              feeStudentMappingModel.feeGroupPromotionMappingId,
            totalPayable: feeStudentMappingModel.totalPayable,
            amountPaid: feeStudentMappingModel.amountPaid,
            linkedPaymentStatus: paymentModel.status,
          })
          .from(feeStudentMappingModel)
          .leftJoin(
            paymentModel,
            eq(paymentModel.id, feeStudentMappingModel.paymentId),
          )
          .where(
            inArray(
              feeStudentMappingModel.feeGroupPromotionMappingId,
              mappingIds,
            ),
          )
      : [];

  const paymentByMappingId = new Map<
    number,
    {
      paymentStatus: "Paid" | "Pending" | "Unpaid";
      amountToPay: number;
      totalPayableAmount: number;
      saveBlockedForEdit: boolean;
    }
  >();
  for (const mappingId of mappingIds) {
    const related = feeStudentMappings.filter(
      (fsm) => fsm.feeGroupPromotionMappingId === mappingId,
    );
    const totalPayableAmount = related.reduce(
      (sum, r) => sum + (r.totalPayable || 0),
      0,
    );
    const amountToPay = related.reduce(
      (sum, r) =>
        sum + Math.max(0, (r.totalPayable || 0) - (r.amountPaid || 0)),
      0,
    );
    const hasSuccessfulPayment = related.some(
      (r) => r.linkedPaymentStatus === "SUCCESS",
    );
    // Only lock the mapping edit UI after a completed (SUCCESS) payment — pending/challan still editable
    const saveBlockedForEdit = hasSuccessfulPayment;
    let paymentStatus: "Paid" | "Pending" | "Unpaid";
    if (hasSuccessfulPayment) {
      paymentStatus = "Paid";
    } else if (related.length === 0) {
      paymentStatus = "Unpaid";
    } else {
      paymentStatus = "Pending";
    }
    paymentByMappingId.set(mappingId, {
      paymentStatus,
      amountToPay,
      totalPayableAmount,
      saveBlockedForEdit,
    });
  }

  // Build DTOs using cached data
  const dtos: FeeGroupPromotionMappingDto[] = [];
  for (const row of rows) {
    const feeGroup = feeGroupMap.get(row.feeGroupId);
    const promotionDto = promotionDtoMap.get(row.promotionId);

    if (!feeGroup || !promotionDto) continue;

    const feeCategory = feeCategoryMap.get(feeGroup.feeCategoryId);
    const feeSlab = feeSlabMap.get(feeGroup.feeSlabId);

    if (!feeCategory || !feeSlab) continue;

    const payment = row.id ? paymentByMappingId.get(row.id) : undefined;

    dtos.push({
      ...row,
      feeGroup: {
        ...feeGroup,
        feeCategory,
        feeSlab,
      },
      promotion: promotionDto,
      paymentStatus: payment?.paymentStatus ?? "Pending",
      amountToPay: payment?.amountToPay ?? 0,
      totalPayableAmount: payment?.totalPayableAmount ?? 0,
      saveBlockedForEdit: payment?.saveBlockedForEdit ?? false,
    });
  }

  return dtos;
};

export const getFeeGroupPromotionMappingById = async (
  id: number,
): Promise<FeeGroupPromotionMappingDto | null> => {
  const [row] = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.id, id));

  return await modelToDto(row ?? null);
};

export const getFeeGroupPromotionMappingsByFeeGroupId = async (
  feeGroupId: number,
): Promise<FeeGroupPromotionMappingDto[]> => {
  const rows = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.feeGroupId, feeGroupId));

  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is FeeGroupPromotionMappingDto => dto !== null);
};

export const getFeeGroupPromotionMappingsByPromotionId = async (
  promotionId: number,
): Promise<FeeGroupPromotionMappingDto[]> => {
  const rows = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.promotionId, promotionId));

  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is FeeGroupPromotionMappingDto => dto !== null);
};

export const updateFeeGroupPromotionMapping = async (
  id: number,
  data: Partial<typeof createFeeGroupPromotionMappingSchema._type>,
  userId: number,
): Promise<FeeGroupPromotionMappingDto | null> => {
  // Get the existing mapping to check if feeGroupId is being changed
  const [existing] = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.id, id));

  if (!existing) {
    return null;
  }

  const [updated] = await db
    .update(feeGroupPromotionMappingModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(feeGroupPromotionMappingModel.id, id))
    .returning();

  if (!updated) {
    return null;
  }

  // If feeGroupId was changed, recalculate totalPayable for all related fee-student-mappings
  const feeGroupChanged =
    data.feeGroupId !== undefined && data.feeGroupId !== existing.feeGroupId;

  if (feeGroupChanged) {
    // Import the calculateTotalPayableForFeeStudentMapping function from fee-structure service
    const { calculateTotalPayableForFeeStudentMapping } =
      await import("./fee-structure.service.js");

    // Find all fee-student-mappings that use this fee-group-promotion-mapping
    const relatedFeeStudentMappings = await db
      .select()
      .from(feeStudentMappingModel)
      .where(eq(feeStudentMappingModel.feeGroupPromotionMappingId, id));

    // Update each fee-student-mapping with recalculated totalPayable
    for (const feeStudentMapping of relatedFeeStudentMappings) {
      const newTotalPayable = await calculateTotalPayableForFeeStudentMapping(
        feeStudentMapping.feeStructureId,
        updated,
      );

      // Recalculate final totalPayable accounting for waived off amount
      const waivedOffAmount = feeStudentMapping.isWaivedOff
        ? feeStudentMapping.waivedOffAmount || 0
        : 0;
      const finalTotalPayable = Math.max(0, newTotalPayable - waivedOffAmount);

      await db
        .update(feeStudentMappingModel)
        .set({
          totalPayable: finalTotalPayable,
          // New slab / fee group → challan format (e.g. category code) may differ; re-issue on next download
          receiptNumber: null,
          challanGeneratedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(feeStudentMappingModel.id, feeStudentMapping.id!));
    }
  }

  const dto = await modelToDto(updated);

  // Emit socket event for fee group promotion mapping update
  const io = socketService.getIO();
  if (io && dto) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_group_promotion_mapping_updated", {
      mappingId: dto.id,
      type: "update",
      message: "A student fee group mapping has been updated",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_group_promotion_mapping_updated_${dto.id}_${Date.now()}`,
      type: "update",
      userId: userId.toString(),
      userName,
      message: `updated student fee group mapping (ID: ${dto.id})`,
      createdAt: new Date(),
      read: false,
      meta: { mappingId: dto.id, type: "update" },
    });
  }

  return dto;
};

export const deleteFeeGroupPromotionMapping = async (
  id: number,
  userId?: number,
): Promise<FeeGroupPromotionMappingDto | null> => {
  // Get the mapping before deletion for socket event
  // const [existing] = await db
  //   .select()
  //   .from(feeGroupPromotionMappingModel)
  //   .where(eq(feeGroupPromotionMappingModel.id, id));

  const [deleted] = await db
    .delete(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.id, id))
    .returning();

  const dto = await modelToDto(deleted ?? null);

  // Emit socket event for fee group promotion mapping deletion
  const io = socketService.getIO();
  if (io && dto) {
    // Get user name for notification if userId provided
    let userName = "Unknown User";
    if (userId) {
      const user = await userService.findById(userId);
      userName = user?.name || "Unknown User";
    }

    io.emit("fee_group_promotion_mapping_deleted", {
      mappingId: id,
      type: "deletion",
      message: "A student fee group mapping has been deleted",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_group_promotion_mapping_deleted_${id}_${Date.now()}`,
      type: "update",
      userId: userId ? userId.toString() : undefined,
      userName,
      message: `deleted student fee group mapping (ID: ${id})`,
      createdAt: new Date(),
      read: false,
      meta: { mappingId: id, type: "deletion" },
    });
  }

  return dto;
};

export interface FeeGroupPromotionFilter {
  academicYearId?: number;
  programCourseId?: number;
  classId?: number;
  shiftId?: number;
  religionId?: number;
  categoryId?: number;
  community?: string;
  feeGroupId: number;
  page?: number;
}

export interface FilteredFeeGroupPromotionMapping {
  promotionId: number;
  studentId: number;
  feeGroupId: number;
  exists: boolean;
}

export const getFilteredFeeGroupPromotionMappings = async (
  filters: FeeGroupPromotionFilter,
): Promise<FilteredFeeGroupPromotionMapping[]> => {
  const conditions = [];

  if (filters.academicYearId) {
    conditions.push(eq(academicYearModel.id, filters.academicYearId));
  }
  if (filters.programCourseId) {
    conditions.push(
      eq(promotionModel.programCourseId, filters.programCourseId),
    );
  }
  if (filters.classId) {
    conditions.push(eq(promotionModel.classId, filters.classId));
  }
  if (filters.shiftId) {
    conditions.push(eq(promotionModel.shiftId, filters.shiftId));
  }
  if (filters.religionId) {
    conditions.push(eq(personalDetailsModel.religionId, filters.religionId));
  }
  if (filters.categoryId) {
    conditions.push(eq(personalDetailsModel.categoryId, filters.categoryId));
  }
  if (filters.community) {
    conditions.push(eq(studentModel.community, filters.community as any));
  }

  if (conditions.length === 0) {
    // Require at least one filter to avoid scanning entire promotions table
    return [];
  }

  const baseQuery = db
    .select({
      promotionId: promotionModel.id,
      studentId: promotionModel.studentId,
    })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .innerJoin(
      academicYearModel,
      eq(academicYearModel.id, sessionModel.academicYearId),
    )
    .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
    .innerJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, studentModel.userId),
    )
    .where(and(...conditions))
    .limit(filters.page || 10);

  const promotionRows = await baseQuery;
  if (!promotionRows.length) {
    return [];
  }

  const promotionIds = promotionRows.map((row) => row.promotionId);

  const mappings = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(
      and(
        inArray(feeGroupPromotionMappingModel.promotionId, promotionIds),
        eq(feeGroupPromotionMappingModel.feeGroupId, filters.feeGroupId),
      ),
    );

  const mappingByPromotionId = new Map<
    number,
    typeof feeGroupPromotionMappingModel.$inferSelect
  >();
  for (const row of mappings) {
    mappingByPromotionId.set(row.promotionId, row);
  }

  return promotionRows.map((row) => ({
    promotionId: row.promotionId,
    studentId: row.studentId,
    feeGroupId: filters.feeGroupId,
    exists: mappingByPromotionId.has(row.promotionId),
  }));
};

/**
 * Calculate total payable amount for fee-student-mapping based on:
 * - Fee structure base amount
 * - Fee structure components (fee heads with percentages)
 * - Fee group's fee slab
 * - Fee structure slab's concession rate
 */
async function calculateTotalPayable(
  feeStructureId: number,
  feeGroupPromotionMapping: typeof feeGroupPromotionMappingModel.$inferSelect,
): Promise<number> {
  // Import the main calculation function
  const { calculateTotalPayableForFeeStudentMapping } =
    await import("./fee-structure.service.js");

  return await calculateTotalPayableForFeeStudentMapping(
    feeStructureId,
    feeGroupPromotionMapping,
  );
}

export interface BulkUploadRow {
  UID?: string;
  "Student Name"?: string;
  "Program Course Name"?: string;
  "Academic Year"?: string;
  Semester?: string;
  Shift?: string;
  "Fee Slab"?: string;
  "Fee Category"?: string;
  "Approved By User Email"?: string;
  "Approved Timestamp"?: string;
  Remarks?: string;
}

export interface BulkUploadResult {
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  errors: Array<{
    row: number;
    data: BulkUploadRow;
    error: string;
  }>;
  success: Array<{
    row: number;
    data: BulkUploadRow;
    mappingId: number;
  }>;
}

function getRowVal(row: Record<string, unknown>, key: string): string {
  const entry = Object.entries(row).find(
    ([k]) => k.trim().toLowerCase() === key.toLowerCase(),
  );
  return (entry?.[1] ?? "").toString().trim();
}

/**
 * Bulk upload fee group promotion mappings from Excel file
 * Excel format: UID, Student Name, Program Course Name, Academic Year, Semester, Shift,
 * Fee Slab, Fee Category, Approved By User Email, Approved Timestamp, Remarks (optional)
 */
export const bulkUploadFeeGroupPromotionMappings = async (
  filePath: string,
  userId: number,
  _uploadSessionId?: string,
): Promise<BulkUploadResult> => {
  const progressUserId = userId.toString();
  const result: BulkUploadResult = {
    summary: { total: 0, successful: 0, failed: 0 },
    errors: [],
    success: [],
  };

  const emitProgress = (
    message: string,
    progress: number,
    status: "started" | "in_progress" | "completed" | "error",
    meta?: Record<string, unknown>,
  ) => {
    const update = socketService.createExportProgressUpdate(
      progressUserId,
      message,
      progress,
      status,
      undefined,
      undefined,
      undefined,
      {
        operation: "fee_group_promotion_bulk_upload",
        ...meta,
      },
    );
    socketService.sendProgressUpdate(progressUserId, update);
  };

  try {
    emitProgress("Reading Excel file...", 0, "started");

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0] ?? "Sheet1";
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      emitProgress("Failed to read worksheet", 100, "error");
      throw new Error("Failed to read worksheet from Excel file");
    }

    const rawData =
      XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
    result.summary.total = rawData.length;

    if (rawData.length === 0) {
      emitProgress("Excel file is empty", 100, "error");
      return result;
    }

    emitProgress("Loading lookup data...", 5, "in_progress");

    // Pre-load lookup data
    const [
      allFeeCategories,
      allFeeSlabs,
      allFeeGroups,
      allProgramCourses,
      allClasses,
      allShifts,
      allAcademicYears,
    ] = await Promise.all([
      db.select().from(feeCategoryModel),
      db.select().from(feeSlabModel),
      db.select().from(feeGroupModel),
      db.select().from(programCourseModel),
      db.select().from(classModel).where(eq(classModel.type, "SEMESTER")),
      db.select().from(shiftModel),
      db.select().from(academicYearModel),
    ]);

    const feeCategoryMap = new Map<string, number>();
    allFeeCategories.forEach((fc) => {
      if (fc.name) feeCategoryMap.set(fc.name.toLowerCase().trim(), fc.id!);
    });
    const feeSlabMap = new Map<string, number>();
    allFeeSlabs.forEach((fs) => {
      if (fs.name) feeSlabMap.set(fs.name.toLowerCase().trim(), fs.id!);
    });
    const feeGroupMap = new Map<string, number>();
    allFeeGroups.forEach((fg) => {
      if (fg.feeCategoryId && fg.feeSlabId && fg.id) {
        feeGroupMap.set(`${fg.feeCategoryId}:${fg.feeSlabId}`, fg.id);
      }
    });
    const programCourseMap = new Map<string, number>();
    allProgramCourses.forEach((pc) => {
      if (pc.name) programCourseMap.set(pc.name.toLowerCase().trim(), pc.id!);
    });
    const classMap = new Map<string, number>();
    allClasses.forEach((c) => {
      if (c.name) classMap.set(c.name.toLowerCase().trim(), c.id!);
    });
    const shiftMap = new Map<string, number>();
    allShifts.forEach((s) => {
      if (s.name) shiftMap.set(s.name.toLowerCase().trim(), s.id!);
    });
    const academicYearMap = new Map<string, number>();
    allAcademicYears.forEach((ay) => {
      const key = ay.year?.toString().toLowerCase().trim();
      if (key) academicYearMap.set(key, ay.id!);
    });

    emitProgress("Validating rows...", 10, "in_progress");

    for (let i = 0; i < rawData.length; i++) {
      const pct = 10 + Math.round((i / rawData.length) * 85);
      if (i % 10 === 0 || i === rawData.length - 1) {
        emitProgress(
          `Processing row ${i + 1} of ${rawData.length}...`,
          pct,
          "in_progress",
          {
            processed: i,
            total: rawData.length,
          },
        );
      }

      const row = rawData[i];
      const rowNumber = i + 2;

      const uid = getRowVal(row, "UID");
      const programCourseName = getRowVal(row, "Program Course Name");
      const academicYear = getRowVal(row, "Academic Year");
      const semester = getRowVal(row, "Semester");
      const shift = getRowVal(row, "Shift");
      const feeSlabName = getRowVal(row, "Fee Slab");
      const feeCategoryName = getRowVal(row, "Fee Category");
      const approvedByEmail = getRowVal(row, "Approved By User Email");

      const rowData: BulkUploadRow = {
        UID: uid,
        "Student Name": getRowVal(row, "Student Name"),
        "Program Course Name": programCourseName,
        "Academic Year": academicYear,
        Semester: semester,
        Shift: shift,
        "Fee Slab": feeSlabName,
        "Fee Category": feeCategoryName,
        "Approved By User Email": approvedByEmail,
        "Approved Timestamp": getRowVal(row, "Approved Timestamp"),
        Remarks: getRowVal(row, "Remarks"),
      };

      if (
        !uid ||
        !programCourseName ||
        !academicYear ||
        !semester ||
        !shift ||
        !feeSlabName ||
        !feeCategoryName ||
        !approvedByEmail
      ) {
        const missing = [];
        if (!uid) missing.push("UID");
        if (!programCourseName) missing.push("Program Course Name");
        if (!academicYear) missing.push("Academic Year");
        if (!semester) missing.push("Semester");
        if (!shift) missing.push("Shift");
        if (!feeSlabName) missing.push("Fee Slab");
        if (!feeCategoryName) missing.push("Fee Category");
        if (!approvedByEmail) missing.push("Approved By User Email");
        result.errors.push({
          row: rowNumber,
          data: rowData,
          error: `Missing required fields: ${missing.join(", ")}`,
        });
        result.summary.failed++;
        continue;
      }

      try {
        // (b) Fee slab and fee category exist
        const feeSlabId = feeSlabMap.get(feeSlabName.toLowerCase());
        const feeCategoryId = feeCategoryMap.get(feeCategoryName.toLowerCase());
        if (!feeSlabId) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `Fee slab "${feeSlabName}" not found`,
          });
          result.summary.failed++;
          continue;
        }
        if (!feeCategoryId) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `Fee category "${feeCategoryName}" not found`,
          });
          result.summary.failed++;
          continue;
        }

        // (c) Fee slab + fee category combination exists in fee_groups
        const feeGroupId = feeGroupMap.get(`${feeCategoryId}:${feeSlabId}`);
        if (!feeGroupId) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `No fee group found for fee slab "${feeSlabName}" and fee category "${feeCategoryName}"`,
          });
          result.summary.failed++;
          continue;
        }

        // (e) User exists for approval email
        const approvedByUser = await userService.findByEmail(approvedByEmail);
        if (!approvedByUser || !approvedByUser.id) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `User with email "${approvedByEmail}" not found`,
          });
          result.summary.failed++;
          continue;
        }

        // (a) Student with uid + program course + semester + shift + academic year exists
        const programCourseId = programCourseMap.get(
          programCourseName.toLowerCase(),
        );
        const classId = classMap.get(semester.toLowerCase());
        const shiftId = shiftMap.get(shift.toLowerCase());
        const academicYearId = academicYearMap.get(academicYear.toLowerCase());

        if (!programCourseId || !classId || !shiftId || !academicYearId) {
          const missing = [];
          if (!programCourseId) missing.push("Program Course");
          if (!classId) missing.push("Semester");
          if (!shiftId) missing.push("Shift");
          if (!academicYearId) missing.push("Academic Year");
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `Invalid lookup: ${missing.join(", ")} not found`,
          });
          result.summary.failed++;
          continue;
        }

        const student = await studentService.findByUid(uid);
        if (!student || !student.id) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `Student with UID "${uid}" not found`,
          });
          result.summary.failed++;
          continue;
        }

        // (a) Promotion: student + program course + semester + shift + academic year
        const sessionsForYear = await db
          .select({ id: sessionModel.id })
          .from(sessionModel)
          .where(eq(sessionModel.academicYearId, academicYearId));
        const sessionIds = sessionsForYear.map((s) => s.id);
        if (sessionIds.length === 0) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `No session found for academic year "${academicYear}"`,
          });
          result.summary.failed++;
          continue;
        }

        const [promotionRecord] = await db
          .select()
          .from(promotionModel)
          .where(
            and(
              eq(promotionModel.studentId, student.id),
              eq(promotionModel.programCourseId, programCourseId),
              eq(promotionModel.classId, classId),
              eq(promotionModel.shiftId, shiftId),
              inArray(promotionModel.sessionId, sessionIds),
            ),
          )
          .orderBy(desc(promotionModel.id))
          .limit(1);

        if (!promotionRecord || !promotionRecord.id) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `No promotion found for student UID "${uid}" with program course "${programCourseName}", semester "${semester}", shift "${shift}", academic year "${academicYear}"`,
          });
          result.summary.failed++;
          continue;
        }

        // (d) Fee structure and fee structure component for fee slab exist
        const [matchingFs] = await db
          .select({ feeStructureId: feeStructureModel.id })
          .from(feeStructureModel)
          .innerJoin(
            feeStructureComponentModel,
            and(
              eq(
                feeStructureComponentModel.feeStructureId,
                feeStructureModel.id,
              ),
              eq(feeStructureComponentModel.feeSlabId, feeSlabId),
            ),
          )
          .where(
            and(
              eq(feeStructureModel.academicYearId, academicYearId),
              eq(feeStructureModel.programCourseId, programCourseId),
              eq(feeStructureModel.classId, classId),
              eq(feeStructureModel.shiftId, shiftId),
            ),
          )
          .limit(1);

        const feeStructureId = matchingFs?.feeStructureId;
        if (!feeStructureId) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `No fee structure with fee slab "${feeSlabName}" found for academic year "${academicYear}", program course "${programCourseName}", semester "${semester}", shift "${shift}"`,
          });
          result.summary.failed++;
          continue;
        }

        // Create or get existing mapping
        const [existingMapping] = await db
          .select()
          .from(feeGroupPromotionMappingModel)
          .where(
            and(
              eq(feeGroupPromotionMappingModel.promotionId, promotionRecord.id),
              eq(feeGroupPromotionMappingModel.feeGroupId, feeGroupId),
            ),
          );

        let createdMappingId: number;
        if (existingMapping) {
          createdMappingId = existingMapping.id!;
          await db
            .update(feeGroupPromotionMappingModel)
            .set({
              updatedAt: new Date(),
              remarks: rowData.Remarks || existingMapping.remarks,
            })
            .where(eq(feeGroupPromotionMappingModel.id, existingMapping.id));
        } else {
          const [createdMapping] = await db
            .insert(feeGroupPromotionMappingModel)
            .values({
              feeGroupId,
              promotionId: promotionRecord.id,

              remarks: rowData.Remarks || null,
            })
            .returning();

          if (!createdMapping || !createdMapping.id) {
            result.errors.push({
              row: rowNumber,
              data: rowData,
              error: "Failed to create mapping",
            });
            result.summary.failed++;
            continue;
          }
          createdMappingId = createdMapping.id;
        }

        // Update fee-student-mapping
        const [selectedMappingFull] = await db
          .select()
          .from(feeGroupPromotionMappingModel)
          .where(eq(feeGroupPromotionMappingModel.id, createdMappingId));

        if (selectedMappingFull) {
          const totalPayable = await calculateTotalPayable(
            feeStructureId,
            selectedMappingFull,
          );
          const [existingFeeStudentMapping] = await db
            .select()
            .from(feeStudentMappingModel)
            .where(
              and(
                eq(feeStudentMappingModel.studentId, student.id),
                eq(feeStudentMappingModel.feeStructureId, feeStructureId),
              ),
            );

          if (existingFeeStudentMapping) {
            const promotionMappingChanged =
              existingFeeStudentMapping.feeGroupPromotionMappingId !==
              createdMappingId;
            await db
              .update(feeStudentMappingModel)
              .set({
                feeGroupPromotionMappingId: createdMappingId,
                totalPayable: Math.max(
                  0,
                  totalPayable -
                    (existingFeeStudentMapping.isWaivedOff
                      ? existingFeeStudentMapping.waivedOffAmount || 0
                      : 0),
                ),
                ...(promotionMappingChanged
                  ? { receiptNumber: null, challanGeneratedAt: null }
                  : {}),
                updatedAt: new Date(),
              })
              .where(
                eq(feeStudentMappingModel.id, existingFeeStudentMapping.id!),
              );
          } else {
            await db.insert(feeStudentMappingModel).values({
              studentId: student.id,
              feeStructureId,
              feeGroupPromotionMappingId: createdMappingId,
              totalPayable,
            });
          }
        }

        result.success.push({
          row: rowNumber,
          data: rowData,
          mappingId: createdMappingId,
        });
        result.summary.successful++;
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          data: rowData,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error processing row",
        });
        result.summary.failed++;
      }
    }

    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("Failed to delete temporary file:", cleanupError);
    }

    const finalStatus = result.summary.failed > 0 ? "completed" : "completed";
    emitProgress(
      `Bulk upload completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
      100,
      finalStatus,
      {
        successful: result.summary.successful,
        failed: result.summary.failed,
      },
    );

    return result;
  } catch (error) {
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("Failed to delete temporary file:", cleanupError);
    }
    emitProgress(
      error instanceof Error ? error.message : "Bulk upload failed",
      100,
      "error",
    );
    throw error;
  }
};
