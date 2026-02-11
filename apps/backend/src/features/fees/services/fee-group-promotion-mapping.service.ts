import { db } from "@/db";
import {
  feeGroupPromotionMappingModel,
  createFeeGroupPromotionMappingSchema,
  feeGroupModel,
  feeCategoryModel,
  feeSlabModel,
  promotionModel,
  boardResultStatusModel,
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
import { and, inArray, or, ilike, desc, eq } from "drizzle-orm";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import { feeStructureModel } from "@repo/db/schemas";
import XLSX from "xlsx";
import fs from "fs";
import * as studentService from "@/features/user/services/student.service.js";
import * as classService from "@/features/academics/services/class.service.js";
import { socketService } from "@/services/socketService.js";
import { feeStudentMappingModel } from "@repo/db/schemas";
import {
  FeeGroupPromotionMappingDto,
  FeeGroupDto,
  FeeCategoryDto,
} from "@repo/db/dtos/fees";
import { PromotionDto } from "@repo/db/dtos/user";
import {
  religionModel,
  categoryModel,
} from "@repo/db/schemas/models/resources";
import * as programCourseService from "@/features/course-design/services/program-course.service.js";
import * as feeCategoryService from "./fee-category.service.js";
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
      createdByUserId: userId,
      updatedByUserId: userId,
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

export const getAllFeeGroupPromotionMappings = async (): Promise<
  FeeGroupPromotionMappingDto[]
> => {
  // Order by id DESC to maintain consistent ordering (updated items stay in place)
  const rows = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .orderBy(desc(feeGroupPromotionMappingModel.id));

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
  const promotionMap = new Map(promotions.map((p) => [p.id, p]));

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

  // Build DTOs using cached data
  const dtos: FeeGroupPromotionMappingDto[] = [];
  for (const row of rows) {
    const feeGroup = feeGroupMap.get(row.feeGroupId);
    const promotionDto = promotionDtoMap.get(row.promotionId);

    if (!feeGroup || !promotionDto) continue;

    const feeCategory = feeCategoryMap.get(feeGroup.feeCategoryId);
    const feeSlab = feeSlabMap.get(feeGroup.feeSlabId);

    if (!feeCategory || !feeSlab) continue;

    dtos.push({
      ...row,
      feeGroup: {
        ...feeGroup,
        feeCategory,
        feeSlab,
      },
      promotion: promotionDto,
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
      updatedByUserId: userId,
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
        updated.feeGroupId,
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
  const [existing] = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.id, id));

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
    .where(and(...conditions));

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
  feeGroupId: number,
): Promise<number> {
  // Import the main calculation function
  const { calculateTotalPayableForFeeStudentMapping } =
    await import("./fee-structure.service.js");

  return await calculateTotalPayableForFeeStudentMapping(
    feeStructureId,
    feeGroupId,
  );
}

export interface BulkUploadRow {
  UID: string;
  Semester: string;
  "Fee Category Name": string;
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

/**
 * Bulk upload fee group promotion mappings from Excel file
 * Excel format: UID, Semester, Fee Category Name
 * TODO: Update to work with fee groups instead of fee categories
 */
export const bulkUploadFeeGroupPromotionMappings = async (
  filePath: string,
  userId: number,
  uploadSessionId?: string,
): Promise<BulkUploadResult> => {
  const io = socketService.getIO();
  const result: BulkUploadResult = {
    summary: { total: 0, successful: 0, failed: 0 },
    errors: [],
    success: [],
  };

  try {
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<BulkUploadRow>(worksheet);

    result.summary.total = data.length;

    // Get all fee categories once for lookup
    const allFeeCategories = await db.select().from(feeCategoryModel);
    const feeCategoryMap = new Map<string, { id: number }>();
    allFeeCategories.forEach((fc) => {
      if (fc.name) {
        feeCategoryMap.set(fc.name.toLowerCase().trim(), {
          id: fc.id!,
        });
      }
    });

    // Process each row
    for (let i = 0; i < data.length; i++) {
      // Emit progress update
      if (io && uploadSessionId) {
        io.to(uploadSessionId).emit("bulk-upload-progress", {
          processed: i,
          total: data.length,
          percent: Math.round((i / data.length) * 100),
        });
      }
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and we skip header

      try {
        // Validate required fields
        const uid = row.UID?.toString()?.trim();
        const semester = row.Semester?.toString()?.trim();
        const feeCategoryName = row["Fee Category Name"]?.toString()?.trim();

        if (!uid || !semester || !feeCategoryName) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error:
              "UID, Semester, and Fee Category Name are required (no blanks allowed)",
          });
          result.summary.failed++;
          continue;
        }

        // Verify fee category exists
        const feeCategoryInfo = feeCategoryMap.get(
          feeCategoryName.toLowerCase(),
        );
        if (!feeCategoryInfo) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `Fee category "${feeCategoryName}" not found`,
          });
          result.summary.failed++;
          continue;
        }
        const feeCategoryId = feeCategoryInfo.id;

        // Get student by UID
        const student = await studentService.findByUid(uid);
        if (!student || !student.id) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `Student with UID "${uid}" not found`,
          });
          result.summary.failed++;
          continue;
        }

        // Get class by semester name
        const [foundClass] = await db
          .select()
          .from(classModel)
          .where(
            and(eq(classModel.name, semester), eq(classModel.type, "SEMESTER")),
          );

        if (!foundClass || !foundClass.id) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `Class/Semester "${semester}" not found`,
          });
          result.summary.failed++;
          continue;
        }

        // Get promotion by studentId and classId
        const [promotion] = await db
          .select()
          .from(promotionModel)
          .where(
            and(
              eq(promotionModel.studentId, student.id),
              eq(promotionModel.classId, foundClass.id),
            ),
          )
          .orderBy(desc(promotionModel.id))
          .limit(1);

        if (!promotion || !promotion.id) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `No promotion found for student UID "${uid}" in semester "${semester}"`,
          });
          result.summary.failed++;
          continue;
        }

        // Check if mapping already exists - if it does, skip creating but still update fee-student-mapping
        const [existingMapping] = await db
          .select()
          .from(feeGroupPromotionMappingModel)
          .where(
            and(
              eq(feeGroupPromotionMappingModel.promotionId, promotion.id),
              eq(feeGroupPromotionMappingModel.feeGroupId, feeCategoryId), // TODO: This should be feeGroupId, needs refactoring
            ),
          );

        let createdMappingId: number;
        if (existingMapping) {
          // Mapping already exists, skip creating but use existing ID for fee-student-mapping update
          createdMappingId = existingMapping.id!;
          // Don't add to errors, just skip creating
        } else {
          // Create fee-group-promotion-mapping
          const [createdMapping] = await db
            .insert(feeGroupPromotionMappingModel)
            .values({
              feeGroupId: feeCategoryId, // TODO: This is wrong - should find/create feeGroup from feeCategory + feeSlab
              promotionId: promotion.id,
              createdByUserId: userId,
              updatedByUserId: userId,
            })
            .returning();

          if (!createdMapping || !createdMapping.id) {
            result.errors.push({
              row: rowNumber,
              data: row,
              error: "Failed to create mapping",
            });
            result.summary.failed++;
            continue;
          }

          createdMappingId = createdMapping.id;
        }

        // After creating/checking fee-group-promotion-mapping, update fee-student-mapping
        // Get all fee-group-promotion-mappings for this promotion ID
        const allMappingsForPromotion = await db
          .select({
            id: feeGroupPromotionMappingModel.id,
            feeGroupId: feeGroupPromotionMappingModel.feeGroupId,
          })
          .from(feeGroupPromotionMappingModel)
          .where(eq(feeGroupPromotionMappingModel.promotionId, promotion.id));

        if (allMappingsForPromotion.length > 0) {
          // Get fee categories with priorities for these mappings
          // TODO: Refactor to get feeCategoryIds from feeGroups
          const feeGroupIds = allMappingsForPromotion.map((m) => m.feeGroupId);
          // Get fee groups to find fee category IDs
          const feeGroups = await db
            .select()
            .from(feeGroupModel)
            .where(inArray(feeGroupModel.id, feeGroupIds));
          const feeCategoryIds = feeGroups.map((fg) => fg.feeCategoryId);
          // Select the first mapping (since priority field doesn't exist, we'll use the first one)
          // TODO: Add priority field to feeCategoryModel if priority-based selection is needed
          const selectedMapping = allMappingsForPromotion[0];

          // Get promotion's session to get academic year for matching fee structures
          const [promotionSession] = await db
            .select()
            .from(sessionModel)
            .where(eq(sessionModel.id, promotion.sessionId));

          if (
            promotionSession &&
            promotionSession.academicYearId !== null &&
            promotionSession.academicYearId !== undefined
          ) {
            // Find fee structures that match this promotion's context
            const matchingFeeStructures = await db
              .select()
              .from(feeStructureModel)
              .where(
                and(
                  eq(
                    feeStructureModel.academicYearId,
                    promotionSession.academicYearId!,
                  ),
                  eq(feeStructureModel.classId, promotion.classId),
                  eq(
                    feeStructureModel.programCourseId,
                    promotion.programCourseId,
                  ),
                  eq(feeStructureModel.shiftId, promotion.shiftId),
                ),
              );

            // Get the fee group for the selected mapping to calculate totalPayable
            const [selectedMappingFull] = await db
              .select()
              .from(feeGroupPromotionMappingModel)
              .where(eq(feeGroupPromotionMappingModel.id, selectedMapping.id));

            if (selectedMappingFull) {
              // Get feeGroup to access feeCategoryId for calculateTotalPayable
              const [feeGroup] = await db
                .select()
                .from(feeGroupModel)
                .where(eq(feeGroupModel.id, selectedMappingFull.feeGroupId));

              if (feeGroup) {
                // Update or create fee-student-mapping for each matching fee structure
                for (const feeStructure of matchingFeeStructures) {
                  // Calculate total payable based on concession rate
                  const totalPayable = await calculateTotalPayable(
                    feeStructure.id!,
                    feeGroup.id!,
                  );

                  // Check if fee-student-mapping already exists for this combination
                  const [existingFeeStudentMapping] = await db
                    .select()
                    .from(feeStudentMappingModel)
                    .where(
                      and(
                        eq(feeStudentMappingModel.studentId, student.id),
                        eq(
                          feeStudentMappingModel.feeStructureId,
                          feeStructure.id!,
                        ),
                      ),
                    );

                  if (existingFeeStudentMapping) {
                    // Update existing mapping
                    await db
                      .update(feeStudentMappingModel)
                      .set({
                        feeGroupPromotionMappingId: selectedMapping.id,
                        totalPayable,
                        updatedAt: new Date(),
                      })
                      .where(
                        eq(
                          feeStudentMappingModel.id,
                          existingFeeStudentMapping.id!,
                        ),
                      );
                  } else {
                    // Create new fee-student-mapping
                    await db.insert(feeStudentMappingModel).values({
                      studentId: student.id,
                      feeStructureId: feeStructure.id!,
                      feeGroupPromotionMappingId: selectedMapping.id,
                      totalPayable,
                    });
                  }
                }
              }
            }
          }
        }

        result.success.push({
          row: rowNumber,
          data: row,
          mappingId: createdMappingId,
        });
        result.summary.successful++;
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          data: row,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error processing row",
        });
        result.summary.failed++;
      }
    }

    // Clean up file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("Failed to delete temporary file:", cleanupError);
    }

    // Emit completion
    if (io && uploadSessionId) {
      if (result.summary.failed > 0) {
        io.to(uploadSessionId).emit("bulk-upload-failed", {
          errorCount: result.summary.failed,
          successCount: result.summary.successful,
        });
      } else {
        io.to(uploadSessionId).emit("bulk-upload-done", {
          successCount: result.summary.successful,
        });
      }
    }

    return result;
  } catch (error) {
    // Clean up file on error
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("Failed to delete temporary file:", cleanupError);
    }

    throw error;
  }
};
