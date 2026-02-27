/**
 * Checks if any fee-student-mapping for a fee structure is marked as paid
 * Returns true if any mapping is paid, else false
 * Adjust the field name (isPaid/paymentStatus) as per your schema
 */
export async function hasPaidFeeStudentMappings(
  feeStructureId: number,
): Promise<boolean> {
  const mappings = await db
    .select()
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.feeStructureId, feeStructureId));
  // Adjust the field name as per your schema
  return mappings.some((m) => m.paymentStatus === "COMPLETED");
}
import { db } from "@/db/index.js";
import {
  CreateFeeStructureDto,
  FeeStructureDto,
  FeeStructureComponentDto,
} from "@repo/db/dtos/fees";
import {
  feeStructureModel,
  FeeStructure,
  feeStructureComponentModel,
  feeStructureInstallmentModel,
  receiptTypeModel,
  feeHeadModel,
  feeSlabModel,
  feeStudentMappingModel,
  feeGroupPromotionMappingModel,
  feeCategoryModel,
  feeGroupModel,
} from "@repo/db/schemas/models/fees";
import {
  academicYearModel,
  classModel,
  shiftModel,
  sessionModel,
} from "@repo/db/schemas/models/academics";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import { promotionModel } from "@repo/db/schemas/models/batches";
import {
  and,
  eq,
  count,
  desc,
  inArray,
  sql,
  ne,
  not,
  notInArray,
  or,
  asc,
} from "drizzle-orm";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import * as academicYearService from "@/features/academics/services/academic-year.service.js";
import * as classService from "@/features/academics/services/class.service.js";
import * as shiftService from "@/features/academics/services/shift.service.js";
import * as programCourseService from "@/features/course-design/services/program-course.service.js";
import * as receiptTypeService from "./receipt-type.service.js";
import * as feeHeadService from "./fee-head.service.js";
import * as feeSlabService from "./fee-slab.service.js";
import { studentModel, userModel } from "@repo/db/index.js";
import { socketService } from "@/services/socketService.js";
import * as userService from "@/features/user/services/user.service.js";

type FeeStructureInsert = typeof feeStructureModel.$inferInsert;

/**
 * Ensures default fee-group-promotion-mapping and fee-student-mapping
 * entries exist for all active students matching the given fee structure.
 *
 * Business rules:
 * - Find all promotions (active students) for:
 *   - same academic year (via session -> academicYear)
 *   - same class, program course, shift as the fee structure
 * - For each promotion:
 *   - Ensure a fee-group-promotion-mapping exists for:
 *     - promotionId
 *     - fee category with name "General"
 *   - If not present, create it (using the provided userId).
 *   - Ensure a fee-student-mapping exists for:
 *     - studentId from promotion
 *     - this feeStructureId
 *     - the mapping created/found above
 *   - If not present, create it.
 *
 * This function is idempotent for a given fee structure and set of promotions.
 */
async function ensureDefaultFeeStudentMappingsForFeeStructure(
  feeStructure: typeof feeStructureModel.$inferSelect,
  userId: number,
  progressUserId?: string,
): Promise<void> {
  const emitProgress = (
    message: string,
    progress: number,
    status: "started" | "in_progress" | "completed" | "error",
    meta?: Record<string, unknown>,
  ) => {
    if (!progressUserId) {
      console.log(
        "[FeeStructureService] Skipping progress update - no progressUserId",
      );
      return;
    }
    console.log(
      `[FeeStructureService] Emitting progress: ${message} (${progress}%) for user ${progressUserId}`,
    );
    const update = socketService.createExportProgressUpdate(
      progressUserId,
      message,
      progress,
      status,
      undefined,
      undefined,
      undefined,
      {
        operation: "fee_structure_mapping",
        feeStructureId: feeStructure.id,
        ...meta,
      },
    );
    socketService.sendProgressUpdate(progressUserId, update);
  };

  if (
    !feeStructure.academicYearId ||
    !feeStructure.classId ||
    !feeStructure.programCourseId ||
    !feeStructure.shiftId
  ) {
    return;
  }

  emitProgress("Preparing fee structure mappings...", 5, "started");

  // Find "General" fee category
  const [generalFeeCategory] = await db
    .select()
    .from(feeCategoryModel)
    .where(
      or(
        eq(feeCategoryModel.name, "General"),
        eq(feeCategoryModel.name, "Full Fee"),
        eq(feeCategoryModel.name, "Full Fees"),
      ),
    );

  if (!generalFeeCategory) {
    console.warn(
      "ensureDefaultFeeStudentMappingsForFeeStructure: 'General' fee category not found. Skipping default mappings.",
    );
    emitProgress(
      "'General' fee category not found. Skipping mappings.",
      100,
      "completed",
    );
    return;
  }

  emitProgress("Finding fee group...", 10, "in_progress");

  // Find a fee group for the "General" fee category
  // We need to find any fee group that belongs to this category
  const [generalFeeGroup] = await db
    .select()
    .from(feeGroupModel)
    .where(eq(feeGroupModel.feeCategoryId, generalFeeCategory.id))
    .limit(1);

  if (!generalFeeGroup) {
    console.warn(
      "ensureDefaultFeeStudentMappingsForFeeStructure: No fee group found for 'General' fee category. Skipping default mappings.",
    );
    emitProgress(
      "No fee group found for 'General' category. Skipping mappings.",
      100,
      "completed",
    );
    return;
  }

  emitProgress("Finding matching students...", 20, "in_progress");

  // Find promotions (active students) matching this fee structure context
  const promotions = await db
    .select({
      id: promotionModel.id,
      studentId: promotionModel.studentId,
    })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .where(
      and(
        eq(sessionModel.academicYearId, feeStructure.academicYearId),
        eq(promotionModel.classId, feeStructure.classId),
        eq(promotionModel.programCourseId, feeStructure.programCourseId),
        eq(promotionModel.shiftId, feeStructure.shiftId),
        eq(userModel.isActive, true),
      ),
    );

  if (!promotions.length || promotions.length === 0) {
    emitProgress(
      "No matching students found. Fee structure saved successfully.",
      100,
      "completed",
    );
    return;
  }

  emitProgress(
    `Processing ${promotions.length} student mappings...`,
    30,
    "in_progress",
    {
      totalStudents: promotions.length,
    },
  );

  const [foundClass] = await db
    .select()
    .from(classModel)
    .where(eq(classModel.id, feeStructure.classId));

  const [foundAcademicYear] = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.id, feeStructure.academicYearId));

  const [foundProgramCourse] = await db
    .select()
    .from(programCourseModel)
    .where(eq(programCourseModel.id, feeStructure.programCourseId));

  let processed = 0;
  for (const promotion of promotions) {
    // 1. Ensure fee-group-promotion-mapping exists for (promotion)
    const [existingMapping] = await db
      .select()
      .from(feeGroupPromotionMappingModel)
      .where(and(eq(feeGroupPromotionMappingModel.promotionId, promotion.id)));

    let feeGroupPromotionMappingId: number;

    if (existingMapping) {
      feeGroupPromotionMappingId = existingMapping.id!;
    } else {
      // For semester 1, we create the mapping by default for all students as they will be new and we want to ensure they get mapped to the general fee group and get the fees calculated without any extra steps.
      if (foundClass.name.toUpperCase() === "SEMESTER I") {
        const [createdMapping] = await db
          .insert(feeGroupPromotionMappingModel)
          .values({
            feeGroupId: generalFeeGroup.id,
            promotionId: promotion.id,
            createdByUserId: userId,
            updatedByUserId: userId,
          })
          .returning();

        feeGroupPromotionMappingId = createdMapping.id!;
      } else {
        // For other semesters, we will take the fee-group mapping from the previous session of the same student provided that the linked fee-group has carry forward enabled.
        const [{ promotions: previousPromotion }] = await db
          .select()
          .from(promotionModel)
          .leftJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
          .where(and(eq(promotionModel.studentId, promotion.studentId)))
          .orderBy(desc(sessionModel.name));

        if (!previousPromotion) continue; // If there is no previous promotion, we cannot carry forward, so we skip creating the mapping for this student.

        const [previousFeeGroupPromotionMapping] = await db
          .select()
          .from(feeGroupPromotionMappingModel)
          .where(
            and(
              eq(
                feeGroupPromotionMappingModel.promotionId,
                previousPromotion.id,
              ),
            ),
          );

        if (!previousFeeGroupPromotionMapping) continue; // If there is no previous mapping, we skip creating the mapping for this student.

        // Check if the fee group linked to the previous mapping has carry forward enabled
        const [previousFeeGroup] = await db
          .select()
          .from(feeGroupModel)
          .where(
            eq(feeGroupModel.id, previousFeeGroupPromotionMapping.feeGroupId),
          );

        let shouldFeeGroupCarryForwarded: boolean = false;

        if (!previousFeeGroup) {
          shouldFeeGroupCarryForwarded = false;
        } else if (
          previousFeeGroup &&
          previousFeeGroup.validityType === "ACADEMIC_YEAR"
        ) {
          const [{ academic_years: previousAcademicYear }] = await db
            .select()
            .from(academicYearModel)
            .leftJoin(
              sessionModel,
              eq(sessionModel.academicYearId, academicYearModel.id),
            )
            .leftJoin(
              promotionModel,
              eq(promotionModel.sessionId, sessionModel.id),
            )
            .where(eq(promotionModel.id, previousPromotion.id));

          if (!previousAcademicYear) {
            throw new Error(
              `Academic year not found for previous promotion ${previousPromotion.id}`,
            );
          }

          if (previousAcademicYear.id === feeStructure.academicYearId) {
            shouldFeeGroupCarryForwarded = true;
          } else {
            shouldFeeGroupCarryForwarded = false;
          }
        } else if (
          previousFeeGroup &&
          previousFeeGroup.validityType === "PROGRAM_COURSE"
        ) {
          const [{ academic_years: registrationAcademicYear }] = await db
            .select()
            .from(promotionModel)
            .leftJoin(
              studentModel,
              eq(studentModel.id, promotionModel.studentId),
            )
            .leftJoin(
              sessionModel,
              eq(sessionModel.id, promotionModel.sessionId),
            )
            .leftJoin(
              academicYearModel,
              eq(academicYearModel.id, sessionModel.academicYearId),
            )
            .where(eq(studentModel.id, promotion.studentId))
            .orderBy(asc(sessionModel.name));

          if (!registrationAcademicYear) {
            throw new Error(
              `Academic year not found for student ${promotion.studentId} registration`,
            );
          }

          const registrationYear = registrationAcademicYear.year
            .split("-")[0]
            .trim();
          const currentYear = foundAcademicYear.year.split("-")[0].trim();

          if (registrationYear + foundProgramCourse.duration <= currentYear) {
            shouldFeeGroupCarryForwarded = true;
          } else {
            shouldFeeGroupCarryForwarded = false;
          }
        } else if (
          previousFeeGroup &&
          previousFeeGroup.validityType === "SEMESTER"
        ) {
          shouldFeeGroupCarryForwarded = false; // Semester-wise fee groups are not carried forward as the fees are different for each semester.
        } else {
          throw new Error(
            `Invalid validity type for fee group ${previousFeeGroup.id}`,
          );
        }

        if (shouldFeeGroupCarryForwarded) {
          feeGroupPromotionMappingId = previousFeeGroupPromotionMapping.id!;
        } else {
          const [createdMapping] = await db
            .insert(feeGroupPromotionMappingModel)
            .values({
              feeGroupId: generalFeeGroup.id,
              promotionId: promotion.id,
              createdByUserId: userId,
              updatedByUserId: userId,
            })
            .returning();

          feeGroupPromotionMappingId = createdMapping.id!;
        }
      }
    }

    // 2. Ensure fee-student-mapping exists for this student + fee structure + mapping
    const [existingFeeStudentMapping] = await db
      .select()
      .from(feeStudentMappingModel)
      .where(
        and(
          eq(feeStudentMappingModel.studentId, promotion.studentId),
          eq(feeStudentMappingModel.feeStructureId, feeStructure.id!),
          eq(
            feeStudentMappingModel.feeGroupPromotionMappingId,
            feeGroupPromotionMappingId,
          ),
        ),
      );

    if (existingFeeStudentMapping) {
      // Update existing mapping with new feeGroupPromotionMappingId and totalPayable
      const [feeGroupPromotionMapping] = await db
        .select()
        .from(feeGroupPromotionMappingModel)
        .where(
          eq(feeGroupPromotionMappingModel.id, feeGroupPromotionMappingId),
        );

      if (feeGroupPromotionMapping) {
        const totalPayable = await calculateTotalPayableForFeeStudentMapping(
          feeStructure.id!,
          feeGroupPromotionMapping,
        );

        await db
          .update(feeStudentMappingModel)
          .set({
            feeGroupPromotionMappingId,
            // If the existing mapping has a waiver, subtract it so DB totalPayable
            // continues to represent the amount after applying student-specific waivers.
            totalPayable: Math.max(
              0,
              totalPayable -
                (existingFeeStudentMapping.isWaivedOff
                  ? existingFeeStudentMapping.waivedOffAmount || 0
                  : 0),
            ),
            updatedAt: new Date(),
          })
          .where(eq(feeStudentMappingModel.id, existingFeeStudentMapping.id!));
      }
      continue;
    }

    processed++;
    const progress = Math.min(
      30 + Math.round((processed / promotions.length) * 60),
      90,
    );
    emitProgress(
      `Processing student ${processed} of ${promotions.length}...`,
      progress,
      "in_progress",
      {
        processed,
        total: promotions.length,
      },
    );

    // Get fee group for the mapping to calculate totalPayable
    const [feeGroupPromotionMapping] = await db
      .select()
      .from(feeGroupPromotionMappingModel)
      .where(eq(feeGroupPromotionMappingModel.id, feeGroupPromotionMappingId));

    let totalPayable = 0;
    if (feeGroupPromotionMapping) {
      totalPayable = await calculateTotalPayableForFeeStudentMapping(
        feeStructure.id!,
        feeGroupPromotionMapping,
      );
    }

    await db.insert(feeStudentMappingModel).values({
      studentId: promotion.studentId,
      feeStructureId: feeStructure.id!,
      feeGroupPromotionMappingId,
      totalPayable,
      // Other fields use their database defaults (e.g. type, totals)
    });
  }

  emitProgress(
    `Successfully processed ${processed} student mappings.`,
    100,
    "completed",
    {
      processed,
      total: promotions.length,
    },
  );
}

/**
 * Calculate total payable amount for fee-student-mapping based on:
 * - Get the fee group and its linked fee slab
 * - Sum only the fee structure components that match the slab
 * - Components are now linked to specific slabs (feeSlabId)
 */
export async function calculateTotalPayableForFeeStudentMapping(
  feeStructureId: number,
  feeGroupPromotionMapping: typeof feeGroupPromotionMappingModel.$inferSelect,
): Promise<number> {
  // Get the fee group to find its linked fee slab
  const [feeGroup] = await db
    .select()
    .from(feeGroupModel)
    .where(eq(feeGroupModel.id, feeGroupPromotionMapping.feeGroupId));

  if (!feeGroup || !feeGroup.feeSlabId) {
    console.warn(
      `No fee slab found for fee group ${feeGroupPromotionMapping.feeGroupId}. Cannot calculate total payable.`,
    );
    return 0;
  }

  // Get fee structure components for this structure and slab
  const feeStructureComponents = await db
    .select()
    .from(feeStructureComponentModel)
    .where(
      and(
        eq(feeStructureComponentModel.feeStructureId, feeStructureId),
        eq(feeStructureComponentModel.feeSlabId, feeGroup.feeSlabId),
      ),
    );

  // Calculate total as sum of all matching component amounts
  if (feeStructureComponents.length > 0) {
    const totalAmount = feeStructureComponents.reduce((sum, component) => {
      return sum + (component.amount || 0);
    }, 0);

    const [feeStudentMapping] = await db
      .select()
      .from(feeStudentMappingModel)
      .where(
        and(
          eq(
            feeStudentMappingModel.feeGroupPromotionMappingId,
            feeGroupPromotionMapping.id,
          ),
          eq(feeStudentMappingModel.feeStructureId, feeStructureId),
        ),
      );

    // Return base total (sum of components) without applying any student-specific
    // waived off amounts. Waiver adjustments are handled at the mapping/update
    // level so saving/updating fee structures doesn't implicitly include
    // student-specific waivers.
    return Math.round(totalAmount);
  }

  return 0;
}

/**
 * Converts a FeeStructure model to FeeStructureDto
 */
async function modelToDto(
  model: typeof feeStructureModel.$inferSelect | null,
): Promise<FeeStructureDto | null> {
  if (!model) return null;

  try {
    // Fetch related entities
    const receiptType = await receiptTypeService.getReceiptTypeById(
      model.receiptTypeId,
    );
    const academicYear = await academicYearService.findAcademicYearById(
      model.academicYearId,
    );
    const programCourse = await programCourseService.findById(
      model.programCourseId,
    );
    const classRecord = await classService.findClassById(model.classId);
    const shift = await shiftService.findById(model.shiftId);

    if (
      !receiptType ||
      !academicYear ||
      !programCourse ||
      !classRecord ||
      !shift
    ) {
      return null;
    }

    // Fetch advance for program course and class if they exist
    const advanceForProgramCourse = model.advanceForProgramCourseId
      ? await programCourseService.findById(model.advanceForProgramCourseId)
      : null;
    const advanceForClass = model.advanceForClassId
      ? await classService.findClassById(model.advanceForClassId)
      : null;

    // Fetch components
    const components = await db
      .select()
      .from(feeStructureComponentModel)
      .where(eq(feeStructureComponentModel.feeStructureId, model.id!));

    const componentDtos: FeeStructureComponentDto[] = await Promise.all(
      components.map(async (component) => {
        const feeHead = await feeHeadService.getFeeHeadById(
          component.feeHeadId,
        );
        const feeSlab = await feeSlabService.getFeeSlabById(
          component.feeSlabId,
        );
        return {
          ...component,
          feeHead: feeHead || null,
          feeSlab: feeSlab || null,
        };
      }),
    );

    // Fetch installments
    const installments = await db
      .select()
      .from(feeStructureInstallmentModel)
      .where(eq(feeStructureInstallmentModel.feeStructureId, model.id!));

    // Build DTO
    const {
      receiptTypeId,
      academicYearId,
      programCourseId,
      classId,
      shiftId,
      advanceForProgramCourseId,
      advanceForClassId,
      ...rest
    } = model;

    return {
      ...rest,
      receiptType,
      academicYear,
      programCourse,
      class: classRecord,
      shift,
      advanceForProgramCourse,
      advanceForClass,
      components: componentDtos,
      installments,
    };
  } catch (error) {
    console.error("Error converting fee structure model to DTO:", error);
    return null;
  }
}

export const createFeeStructure = async (
  data: Omit<FeeStructureInsert, "id" | "createdAt" | "updatedAt">,
  userId: number,
): Promise<FeeStructureDto | null> => {
  const [created] = await db
    .insert(feeStructureModel)
    .values({
      ...data,
      createdByUserId: userId,
      updatedByUserId: userId,
    })
    .returning();
  if (!created) return null;

  // After creating fee structure, ensure default fee-student-mappings
  await ensureDefaultFeeStudentMappingsForFeeStructure(
    created,
    userId,
    userId.toString(),
  );

  const dto = await modelToDto(created);

  // Emit socket event for fee structure creation
  const io = socketService.getIO();
  if (io && dto) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_structure_created", {
      feeStructureId: dto.id,
      type: "creation",
      message: "A new fee structure has been created",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    const notification = {
      id: `fee_structure_created_${dto.id}_${Date.now()}`,
      type: "info" as const,
      userId: userId.toString(),
      userName,
      message: `created a new fee structure (ID: ${dto.id})`,
      createdAt: new Date(),
      read: false,
      meta: { feeStructureId: dto.id, type: "creation" },
    };
    socketService.sendNotificationToAdminStaff(notification);
    io.emit("notification", notification);
  }

  return dto;
};

export const getAllFeeStructures = async (
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    academicYearId?: number;
    classId?: number;
    receiptTypeId?: number;
    programCourseId?: number;
    shiftId?: number;
  },
): Promise<PaginatedResponse<FeeStructureDto>> => {
  const offset = (page - 1) * pageSize;
  const limit = Math.max(1, Math.min(100, pageSize)); // Limit pageSize between 1 and 100

  // Build where conditions
  const conditions = [];
  if (filters?.academicYearId) {
    conditions.push(
      eq(feeStructureModel.academicYearId, filters.academicYearId),
    );
  }
  if (filters?.classId) {
    conditions.push(eq(feeStructureModel.classId, filters.classId));
  }
  if (filters?.receiptTypeId) {
    conditions.push(eq(feeStructureModel.receiptTypeId, filters.receiptTypeId));
  }
  if (filters?.programCourseId) {
    conditions.push(
      eq(feeStructureModel.programCourseId, filters.programCourseId),
    );
  }
  if (filters?.shiftId) {
    conditions.push(eq(feeStructureModel.shiftId, filters.shiftId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countQuery = db.select({ count: count() }).from(feeStructureModel);

  const [{ count: totalCount }] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

  const totalElements = Number(totalCount || 0);
  const totalPages = Math.max(1, Math.ceil(totalElements / limit));

  // Get paginated structures
  let query = db
    .select()
    .from(feeStructureModel)
    .orderBy(desc(feeStructureModel.id))
    .limit(limit)
    .offset(offset);

  if (whereClause) {
    query = query.where(whereClause) as any;
  }

  const structures = await query;

  if (structures.length === 0) {
    return {
      content: [],
      page,
      pageSize: limit,
      totalPages,
      totalElements,
    };
  }

  // Collect all unique IDs for batch fetching
  const structureIds = structures.map((s) => s.id!).filter(Boolean);
  const receiptTypeIds = Array.from(
    new Set(structures.map((s) => s.receiptTypeId).filter(Boolean)),
  );
  const academicYearIds = Array.from(
    new Set(structures.map((s) => s.academicYearId).filter(Boolean)),
  );
  const programCourseIds = Array.from(
    new Set(
      structures
        .map((s) => [s.programCourseId, s.advanceForProgramCourseId])
        .flat()
        .filter((id): id is number => typeof id === "number" && id !== null),
    ),
  );
  const classIds = Array.from(
    new Set(
      structures
        .map((s) => [s.classId, s.advanceForClassId])
        .flat()
        .filter((id): id is number => typeof id === "number" && id !== null),
    ),
  );
  const shiftIds = Array.from(
    new Set(structures.map((s) => s.shiftId).filter(Boolean)),
  );

  // Batch fetch all related entities in parallel
  // Note: For program courses, we need to use the service to get full DTOs with nested relations
  const [
    receiptTypes,
    academicYears,
    programCoursesRaw,
    classes,
    shifts,
    components,
    installments,
  ] = await Promise.all([
    receiptTypeIds.length > 0
      ? db
          .select()
          .from(receiptTypeModel)
          .where(inArray(receiptTypeModel.id, receiptTypeIds))
      : [],
    academicYearIds.length > 0
      ? db
          .select()
          .from(academicYearModel)
          .where(inArray(academicYearModel.id, academicYearIds))
      : [],
    programCourseIds.length > 0
      ? db
          .select()
          .from(programCourseModel)
          .where(inArray(programCourseModel.id, programCourseIds))
      : [],
    classIds.length > 0
      ? db.select().from(classModel).where(inArray(classModel.id, classIds))
      : [],
    shiftIds.length > 0
      ? db.select().from(shiftModel).where(inArray(shiftModel.id, shiftIds))
      : [],
    structureIds.length > 0
      ? db
          .select()
          .from(feeStructureComponentModel)
          .where(
            inArray(feeStructureComponentModel.feeStructureId, structureIds),
          )
      : [],
    structureIds.length > 0
      ? db
          .select()
          .from(feeStructureInstallmentModel)
          .where(
            inArray(feeStructureInstallmentModel.feeStructureId, structureIds),
          )
      : [],
  ]);

  // Convert program courses to DTOs (they need nested relations)
  // Use findById to get full DTOs with nested relations
  const programCourseDtos = await Promise.all(
    programCourseIds.map((id) => programCourseService.findById(id)),
  );
  const programCourseMap = new Map(
    programCourseDtos
      .filter((dto): dto is NonNullable<typeof dto> => dto !== null)
      .map((dto) => [dto.id, dto]),
  );

  // Create lookup maps
  const receiptTypeMap = new Map(receiptTypes.map((rt) => [rt.id, rt]));
  const academicYearMap = new Map(academicYears.map((ay) => [ay.id, ay]));
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const shiftMap = new Map(shifts.map((s) => [s.id, s]));

  // Group components and installments by structure ID
  const componentsByStructureId = new Map<
    number,
    (typeof components)[number][]
  >();
  const installmentsByStructureId = new Map<
    number,
    (typeof installments)[number][]
  >();

  for (const component of components) {
    const structId = component.feeStructureId;
    if (!componentsByStructureId.has(structId)) {
      componentsByStructureId.set(structId, []);
    }
    componentsByStructureId.get(structId)!.push(component);
  }

  for (const installment of installments) {
    const structId = installment.feeStructureId;
    if (!installmentsByStructureId.has(structId)) {
      installmentsByStructureId.set(structId, []);
    }
    installmentsByStructureId.get(structId)!.push(installment);
  }

  // Fetch fee heads and fee slabs for components
  const feeHeadIds = Array.from(
    new Set(components.map((c) => c.feeHeadId).filter(Boolean)),
  );
  const feeSlabIds = Array.from(
    new Set(components.map((c) => c.feeSlabId).filter(Boolean)),
  );

  const [feeHeads, feeSlabs] = await Promise.all([
    feeHeadIds.length > 0
      ? db
          .select()
          .from(feeHeadModel)
          .where(inArray(feeHeadModel.id, feeHeadIds))
      : [],
    feeSlabIds.length > 0
      ? db
          .select()
          .from(feeSlabModel)
          .where(inArray(feeSlabModel.id, feeSlabIds))
      : [],
  ]);

  const feeHeadMap = new Map(feeHeads.map((fh) => [fh.id, fh]));
  const feeSlabMap = new Map(feeSlabs.map((fs) => [fs.id, fs]));

  // Convert to DTOs using batch-fetched data
  const dtos: FeeStructureDto[] = [];
  for (const structure of structures) {
    const receiptType = receiptTypeMap.get(structure.receiptTypeId);
    const academicYear = academicYearMap.get(structure.academicYearId);
    const programCourse = programCourseMap.get(structure.programCourseId);
    const classRecord = classMap.get(structure.classId);
    const shift = shiftMap.get(structure.shiftId);

    if (
      !receiptType ||
      !academicYear ||
      !programCourse ||
      !classRecord ||
      !shift
    ) {
      continue; // Skip structures with missing required relations
    }

    const advanceForProgramCourse = structure.advanceForProgramCourseId
      ? programCourseMap.get(structure.advanceForProgramCourseId) || null
      : null;
    const advanceForClass = structure.advanceForClassId
      ? classMap.get(structure.advanceForClassId) || null
      : null;

    // Build component DTOs
    const structureComponents =
      componentsByStructureId.get(structure.id!) || [];
    const componentDtos: FeeStructureComponentDto[] = structureComponents.map(
      (component) => ({
        ...component,
        feeHead: feeHeadMap.get(component.feeHeadId) || null,
        feeSlab: feeSlabMap.get(component.feeSlabId) || null,
      }),
    );

    // Get installments
    const structureInstallments =
      installmentsByStructureId.get(structure.id!) || [];

    // Build DTO
    const {
      receiptTypeId,
      academicYearId,
      programCourseId,
      classId,
      shiftId,
      advanceForProgramCourseId,
      advanceForClassId,
      ...rest
    } = structure;

    dtos.push({
      ...rest,
      receiptType,
      academicYear,
      programCourse,
      class: classRecord,
      shift,
      advanceForProgramCourse,
      advanceForClass,
      components: componentDtos,
      installments: structureInstallments,
    });
  }

  return {
    content: dtos,
    page,
    pageSize: limit,
    totalPages,
    totalElements,
  };
};

export async function createFeeStructureByDto(
  givenDto: CreateFeeStructureDto,
  userId: number,
): Promise<FeeStructureDto[]> {
  const createdStructures: FeeStructureDto[] = [];
  const progressUserId = userId.toString();
  const totalStructures =
    givenDto.programCourseIds.length * givenDto.shiftIds.length;
  let structuresProcessed = 0;

  // Emit initial progress for bulk operation
  const emitBulkProgress = (
    message: string,
    progress: number,
    status: "started" | "in_progress" | "completed" | "error",
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
        operation: "fee_structure_mapping",
        totalStructures,
        structuresProcessed,
      },
    );
    socketService.sendProgressUpdate(progressUserId, update);
  };

  emitBulkProgress(
    `Creating ${totalStructures} fee structure(s)...`,
    0,
    "started",
  );

  for (let i = 0; i < givenDto.programCourseIds.length; i++) {
    for (let j = 0; j < givenDto.shiftIds.length; j++) {
      // Step 1: - Create fee structure for each combination of programCourseId and shiftId
      const feeStructuredataToInsert: Omit<
        FeeStructure,
        "id" | "createdAt" | "updatedAt"
      > = {
        academicYearId: givenDto.academicYearId,
        classId: givenDto.classId,
        receiptTypeId: givenDto.receiptTypeId,
        programCourseId: givenDto.programCourseIds[i],
        shiftId: givenDto.shiftIds[j],
        closingDate: givenDto.closingDate,
        startDate: givenDto.startDate,
        endDate: givenDto.endDate,
        onlineStartDate: givenDto.onlineStartDate,
        onlineEndDate: givenDto.onlineEndDate,
        numberOfInstallments: givenDto.numberOfInstallments,
        advanceForProgramCourseId:
          givenDto.advanceForProgramCourseIds?.[i] || null,
        advanceForClassId: null, // advanceForClassIds not in DTO, set to null
        isPublished: false,
        createdByUserId: userId,
        updatedByUserId: userId,
      };
      const [existingFeeStructure] = await db
        .select()
        .from(feeStructureModel)
        .where(
          and(
            eq(
              feeStructureModel.academicYearId,
              feeStructuredataToInsert.academicYearId,
            ),
            eq(feeStructureModel.classId, feeStructuredataToInsert.classId),
            eq(
              feeStructureModel.programCourseId,
              feeStructuredataToInsert.programCourseId,
            ),
            eq(feeStructureModel.shiftId, feeStructuredataToInsert.shiftId),
            eq(
              feeStructureModel.receiptTypeId,
              feeStructuredataToInsert.receiptTypeId,
            ),
          ),
        );

      if (existingFeeStructure) {
        // Skip creation if fee structure already exists
        structuresProcessed++;
        const bulkProgress = Math.min(
          Math.round((structuresProcessed / totalStructures) * 90),
          90,
        );
        emitBulkProgress(
          `Skipped ${structuresProcessed} of ${totalStructures} (already exists)...`,
          bulkProgress,
          structuresProcessed === totalStructures ? "completed" : "in_progress",
        );
        continue;
      }

      // Create new fee structure
      const [newFeesStructure] = await db
        .insert(feeStructureModel)
        .values({
          ...feeStructuredataToInsert,
          createdByUserId: userId,
          updatedByUserId: userId,
        })
        .returning();

      if (!newFeesStructure) continue;

      // Step 2: - Add the components
      for (let k = 0; k < givenDto.components.length; k++) {
        const component = givenDto.components[k];

        await db.insert(feeStructureComponentModel).values({
          ...component,
          feeStructureId: newFeesStructure.id!,
        });
      }

      // Step 3: - Add installments if provided
      if (givenDto.installments && givenDto.installments.length > 0) {
        for (let k = 0; k < givenDto.installments.length; k++) {
          const installment = givenDto.installments[k];
          await db.insert(feeStructureInstallmentModel).values({
            ...installment,
            feeStructureId: newFeesStructure.id!,
          });
        }
      }

      // Step 4.5: Ensure default fee-student-mappings for this new fee structure
      await ensureDefaultFeeStudentMappingsForFeeStructure(
        newFeesStructure,
        userId,
        progressUserId,
      );

      // Convert to DTO and add to results
      const dto = await modelToDto(newFeesStructure);
      if (dto) {
        createdStructures.push(dto);
      }

      structuresProcessed++;
      const bulkProgress = Math.min(
        Math.round((structuresProcessed / totalStructures) * 90),
        90,
      );
      emitBulkProgress(
        `Created ${structuresProcessed} of ${totalStructures} fee structure(s)...`,
        bulkProgress,
        structuresProcessed === totalStructures ? "completed" : "in_progress",
      );
    }
  }

  // Emit final completion progress
  if (createdStructures.length > 0) {
    emitBulkProgress(
      `Successfully created ${createdStructures.length} fee structure(s).`,
      100,
      "completed",
    );
  } else {
    emitBulkProgress("No fee structures were created.", 100, "completed");
  }

  // Emit socket events for all created fee structures
  const io = socketService.getIO();
  if (io && createdStructures.length > 0) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    for (const dto of createdStructures) {
      io.emit("fee_structure_created", {
        feeStructureId: dto.id,
        type: "creation",
        message: "A new fee structure has been created",
        timestamp: new Date().toISOString(),
      });
    }

    // Emit single notification for bulk creation
    io.emit("notification", {
      id: `fee_structure_created_bulk_${Date.now()}`,
      type: "info",
      userId: userId.toString(),
      userName,
      message: `created ${createdStructures.length} new fee structure(s)`,
      createdAt: new Date(),
      read: false,
      meta: {
        feeStructureIds: createdStructures.map((s) => s.id),
        type: "creation",
        count: createdStructures.length,
      },
    });
  }

  return createdStructures;
}

/**
 * Updates a fee structure by DTO with upsert logic for components, concession slabs, and installments
 */
export async function updateFeeStructureByDto(
  feeStructureId: number,
  givenDto: CreateFeeStructureDto,
  userId: number,
): Promise<FeeStructureDto | null> {
  const progressUserId = userId.toString();

  // Emit initial progress for update operation
  const emitUpdateProgress = (
    message: string,
    progress: number,
    status: "started" | "in_progress" | "completed" | "error",
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
        operation: "fee_structure_mapping",
        feeStructureId,
      },
    );
    socketService.sendProgressUpdate(progressUserId, update);
  };

  emitUpdateProgress("Updating fee structure...", 0, "started");

  // Step 1: Check if fee structure exists
  const [existingFeeStructure] = await db
    .select()
    .from(feeStructureModel)
    .where(eq(feeStructureModel.id, feeStructureId));

  if (!existingFeeStructure) {
    emitUpdateProgress("Fee structure not found.", 100, "error");
    return null;
  }

  emitUpdateProgress("Updating fee structure data...", 10, "in_progress");

  // Step 2: Update the fee structure itself
  const feeStructureDataToUpdate: Partial<FeeStructure> = {
    academicYearId: givenDto.academicYearId,
    classId: givenDto.classId,
    receiptTypeId: givenDto.receiptTypeId,
    programCourseId:
      givenDto.programCourseIds[0] || existingFeeStructure.programCourseId, // For single structure update
    shiftId: givenDto.shiftIds[0] || existingFeeStructure.shiftId, // For single structure update
    closingDate: givenDto.closingDate,
    startDate: givenDto.startDate,
    endDate: givenDto.endDate,
    onlineStartDate: givenDto.onlineStartDate,
    onlineEndDate: givenDto.onlineEndDate,
    numberOfInstallments: givenDto.numberOfInstallments,
    advanceForProgramCourseId: givenDto.advanceForProgramCourseIds?.[0] || null,
    advanceForClassId: null,
  };

  const [updatedFeeStructure] = await db
    .update(feeStructureModel)
    .set({
      ...feeStructureDataToUpdate,
      updatedByUserId: userId,
    })
    .where(eq(feeStructureModel.id, feeStructureId))
    .returning();

  if (!updatedFeeStructure) {
    return null;
  }

  // Step 3: Upsert components (delete existing and insert new)
  // Delete existing components
  await db
    .delete(feeStructureComponentModel)
    .where(eq(feeStructureComponentModel.feeStructureId, feeStructureId));

  // Insert new components
  if (givenDto.components && givenDto.components.length > 0) {
    for (let k = 0; k < givenDto.components.length; k++) {
      const component = givenDto.components[k];
      await db.insert(feeStructureComponentModel).values({
        ...component,
        feeStructureId: feeStructureId,
      });
    }
  }

  // Step 4: Upsert installments (delete existing and insert new)
  // Delete existing installments
  await db
    .delete(feeStructureInstallmentModel)
    .where(eq(feeStructureInstallmentModel.feeStructureId, feeStructureId));

  // Insert new installments
  if (givenDto.installments && givenDto.installments.length > 0) {
    for (let k = 0; k < givenDto.installments.length; k++) {
      const installment = givenDto.installments[k];
      await db.insert(feeStructureInstallmentModel).values({
        ...installment,
        feeStructureId: feeStructureId,
      });
    }
  }

  emitUpdateProgress("Updating student mappings...", 50, "in_progress");

  // After updating, ensure default fee-student-mappings exist
  await ensureDefaultFeeStudentMappingsForFeeStructure(
    updatedFeeStructure,
    userId,
    progressUserId,
  );

  emitUpdateProgress("Fee structure updated successfully.", 100, "completed");

  // Convert to DTO and return
  const dto = await modelToDto(updatedFeeStructure);

  // Emit socket event for fee structure update
  const io = socketService.getIO();
  if (io && dto) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_structure_updated", {
      feeStructureId: dto.id,
      type: "update",
      message: "A fee structure has been updated",
      timestamp: new Date().toISOString(),
    });

    const notification = {
      id: `fee_structure_updated_${dto.id}_${Date.now()}`,
      type: "update" as const,
      userId: userId.toString(),
      userName,
      message: `updated fee structure (ID: ${dto.id})`,
      createdAt: new Date(),
      read: false,
      meta: { feeStructureId: dto.id, type: "update" },
    };
    socketService.sendNotificationToAdminStaff(notification);
    io.emit("notification", notification);
  }

  return dto;
}

export const getFeeStructureById = async (
  id: number,
): Promise<FeeStructureDto | null> => {
  const [found] = await db
    .select()
    .from(feeStructureModel)
    .where(eq(feeStructureModel.id, id));
  if (!found) return null;
  return await modelToDto(found);
};

// TODO: Update function should be handling the upsert for all the related entities.
export const updateFeeStructure = async (
  id: number,
  data: Partial<FeeStructure>,
  userId: number,
): Promise<FeeStructureDto | null> => {
  const [updated] = await db
    .update(feeStructureModel)
    .set({
      ...data,
      updatedByUserId: userId,
    })
    .where(eq(feeStructureModel.id, id))
    .returning();
  if (!updated) return null;

  // After updating, ensure default fee-student-mappings exist
  await ensureDefaultFeeStudentMappingsForFeeStructure(
    updated,
    userId,
    userId.toString(),
  );

  const dto = await modelToDto(updated);

  // Emit socket event for fee structure update
  const io = socketService.getIO();
  if (io && dto) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_structure_updated", {
      feeStructureId: dto.id,
      type: "update",
      message: "A fee structure has been updated",
      timestamp: new Date().toISOString(),
    });

    const notification = {
      id: `fee_structure_updated_${dto.id}_${Date.now()}`,
      type: "update" as const,
      userId: userId.toString(),
      userName,
      message: `updated fee structure (ID: ${dto.id})`,
      createdAt: new Date(),
      read: false,
      meta: { feeStructureId: dto.id, type: "update" },
    };
    socketService.sendNotificationToAdminStaff(notification);
    io.emit("notification", notification);
  }

  return dto;
};

export const deleteFeeStructure = async (
  id: number,
  userId?: number,
): Promise<FeeStructureDto | null> => {
  // First, get the fee structure to return it later
  const [existingFeeStructure] = await db
    .select()
    .from(feeStructureModel)
    .where(eq(feeStructureModel.id, id));

  if (!existingFeeStructure) {
    return null;
  }

  // Convert to DTO before deletion (to return it)
  const feeStructureDto = await modelToDto(existingFeeStructure);
  if (!feeStructureDto) {
    return null;
  }

  // Delete nested data in a transaction to ensure atomicity
  await db.transaction(async (tx) => {
    // Delete nested data in the correct order (respecting foreign key constraints)
    // 1. Delete fee_student_mappings first (references feeStructureId and feeStructureInstallmentId)
    const result = await tx
      .select({ promotionId: promotionModel.id })
      .from(feeStudentMappingModel)
      .leftJoin(
        feeGroupPromotionMappingModel,
        eq(
          feeStudentMappingModel.feeGroupPromotionMappingId,
          feeGroupPromotionMappingModel.id,
        ),
      )
      .leftJoin(
        promotionModel,
        eq(feeGroupPromotionMappingModel.promotionId, promotionModel.id),
      )
      .where(eq(feeStudentMappingModel.feeStructureId, id));
    await tx
      .delete(feeStudentMappingModel)
      .where(eq(feeStudentMappingModel.feeStructureId, id));

    // 3. Delete fee_structure_components
    await tx
      .delete(feeStructureComponentModel)
      .where(eq(feeStructureComponentModel.feeStructureId, id));

    // 4. Delete fee_structure_installments (must be deleted after fee_student_mappings since they reference it)
    await tx
      .delete(feeStructureInstallmentModel)
      .where(eq(feeStructureInstallmentModel.feeStructureId, id));

    // 5. Finally, delete the fee structure itself
    await tx.delete(feeStructureModel).where(eq(feeStructureModel.id, id));

    // 6. delete related fee group promotion mappings for the slabs used in this fee structure
    if (result.length > 0) {
      const promotionIds = result.map((row) => row.promotionId!);

      await tx
        .delete(feeGroupPromotionMappingModel)
        .where(
          and(inArray(feeGroupPromotionMappingModel.promotionId, promotionIds)),
        );
    }
  });

  // Emit socket event for fee structure deletion
  const io = socketService.getIO();
  if (io) {
    // Get user name for notification if userId provided
    let userName = "Unknown User";
    if (userId) {
      const user = await userService.findById(userId);
      userName = user?.name || "Unknown User";
    }

    io.emit("fee_structure_deleted", {
      feeStructureId: id,
      type: "deletion",
      message: "A fee structure has been deleted",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    const notification = {
      id: `fee_structure_deleted_${id}_${Date.now()}`,
      type: "update" as const,
      userId: userId?.toString() || "",
      userName,
      message: `deleted fee structure (ID: ${id})`,
      createdAt: new Date(),
      read: false,
      meta: { feeStructureId: id, type: "deletion" },
    };
    socketService.sendNotificationToAdminStaff(notification);
    io.emit("notification", notification);
  }

  return feeStructureDto;
};

// export const getFeesStructureById = async (
//     id: number,
// ): Promise<FeesStructureDto | null> => {
//     try {
//         const advanceCourse = alias(courseModel, "advanceCourse");
//         const feesStructures = await db
//             .select({
//                 id: feesStructureModel.id,
//                 closingDate: feesStructureModel.closingDate,
//                 academicYearId: feesStructureModel.academicYearId,
//                 courseId: feesStructureModel.courseId,
//                 semester: classModel.name,
//                 advanceForCourseId: feesStructureModel.advanceForCourseId,
//                 advanceForSemester: feesStructureModel.advanceForSemester,
//                 startDate: feesStructureModel.startDate,
//                 endDate: feesStructureModel.endDate,
//                 onlineStartDate: feesStructureModel.onlineStartDate,
//                 onlineEndDate: feesStructureModel.onlineEndDate,
//                 numberOfInstalments: feesStructureModel.numberOfInstalments,
//                 // instalmentStartDate: feesStructureModel.instalmentStartDate,
//                 // instalmentEndDate: feesStructureModel.instalmentEndDate,
//                 createdAt: feesStructureModel.createdAt,
//                 updatedAt: feesStructureModel.updatedAt,
//                 academicYear: academicYearModel,
//                 course: courseModel,
//                 advanceForCourse: advanceCourse,
//                 shiftId: feesStructureModel.shiftId,
//             })
//             .from(feesStructureModel)
//             .leftJoin(
//                 academicYearModel,
//                 eq(feesStructureModel.academicYearId, academicYearModel.id),
//             )
//             .leftJoin(classModel, eq(classModel.id, feesStructureModel.classId))
//             .leftJoin(courseModel, eq(feesStructureModel.courseId, courseModel.id))
//             .leftJoin(
//                 advanceCourse,
//                 eq(feesStructureModel.advanceForCourseId, advanceCourse.id),
//             )
//             .where(eq(feesStructureModel.id, id));

//         if (feesStructures.length === 0) {
//             return null;
//         }
//         const feesStructure = feesStructures[0];

//         if (!feesStructure.academicYear || !feesStructure.course) {
//             return null;
//         }

//         const components = await db
//             .select()
//             .from(feesComponentModel)
//             .where(eq(feesComponentModel.feesStructureId, feesStructure.id));
//         let shift: Shift | undefined = undefined;
//         if (feesStructure.shiftId) {
//             const [foundShift] = await db
//                 .select()
//                 .from(shiftModel)
//                 .where(eq(shiftModel.id, feesStructure.shiftId));
//             shift = foundShift;
//         }
//         const feesSlabMappings = await getFeesSlabMappingsByFeesStructureId(
//             feesStructure.id!,
//         );
//         const [fooundClass] = await db
//             .select()
//             .from(classModel)
//             .where(eq(classModel.name, feesStructure.semester!));

//         // Fetch instalments for this feesStructure
//         const instalments: Instalment[] = await db
//             .select()
//             .from(instalmentModel)
//             .where(eq(instalmentModel.feesStructureId, feesStructure.id));

//         return {
//             ...feesStructure,
//             feesSlabMappings,
//             class: fooundClass,
//             academicYear: feesStructure.academicYear,
//             course: feesStructure.course,
//             advanceForCourse: feesStructure.advanceForCourse,
//             components,
//             shift,
//             instalments,
//         };
//     } catch (error) {
//         return null;
//     }
// };

// export const getAcademicYearsFromFeesStructures = async (): Promise<
//     AcademicYear[]
// > => {
//     const academicYearIds = await db
//         .selectDistinct({
//             academicYearId: feesStructureModel.academicYearId,
//             id: feesStructureModel.id, // Include this for ORDER BY
//         })
//         .from(feesStructureModel)
//         .orderBy(desc(feesStructureModel.id));

//     return await db
//         .select()
//         .from(academicYearModel)
//         .where(
//             inArray(
//                 academicYearModel.id,
//                 academicYearIds.map((ay) => ay.academicYearId),
//             ),
//         );
// };

// export const getCoursesFromFeesStructures = async (
//     academicYearId: number,
// ): Promise<Course[]> => {
//     const courseIds = await db
//         .selectDistinct({
//             courseId: feesStructureModel.courseId,
//             id: feesStructureModel.id,
//         })
//         .from(feesStructureModel)
//         .where(eq(feesStructureModel.academicYearId, academicYearId))
//         .orderBy(desc(feesStructureModel.id));

//     return await db
//         .select()
//         .from(courseModel)
//         .where(
//             inArray(
//                 courseModel.id,
//                 courseIds.map((crs) => crs.courseId),
//             ),
//         );
// };

// export const getFeesStructuresByAcademicYearIdAndCourseId = async (
//     academicYearId: number,
//     courseId: number,
// ): Promise<FeesStructureDto[]> => {
//     const feesStructures = await db
//         .select()
//         .from(feesStructureModel)
//         .where(
//             and(
//                 eq(feesStructureModel.academicYearId, academicYearId),
//                 eq(feesStructureModel.courseId, courseId),
//             ),
//         )
//         .orderBy(desc(feesStructureModel.id));

//     const results = await Promise.all(
//         feesStructures.map(async (fs) => await modelToDto(fs)),
//     );
//     return results.filter(
//         (result): result is FeesStructureDto => result !== null,
//     );
// };

// export const createFeesStructure = async (
//     createFeesStructureDto: CreateFeesStructureDto,
// ) => {
//     try {
//         console.log(createFeesStructureDto);
//         const {
//             id,
//             components,
//             class: feesClassSem,
//             feesSlabMappings,
//             academicYear,
//             advanceForCourse,
//             shift,
//             createdAt,
//             updatedAt,
//             ...rest
//         } = createFeesStructureDto;

//         if (!academicYear?.id) {
//             throw new Error(
//                 "Academic Year and Course are required to create a fee structure.",
//             );
//         }

//         for (let i = 0; i < createFeesStructureDto.courses.length; i++) {
//             const course = createFeesStructureDto.courses[i];
//             if (!course.id) {
//                 throw new Error(`Course ID is required for course at index ${i}.`);
//             }
//             const [existing] = await db
//                 .select()
//                 .from(feesStructureModel)
//                 .where(
//                     and(
//                         eq(feesStructureModel.academicYearId, academicYear.id!),
//                         eq(feesStructureModel.courseId, course.id!),
//                         eq(feesStructureModel.classId, feesClassSem.id!),
//                         eq(feesStructureModel.shiftId, shift?.id!),
//                         eq(
//                             feesStructureModel.feesReceiptTypeId,
//                             createFeesStructureDto?.feesReceiptTypeId!,
//                         ),
//                     ),
//                 );

//             if (existing) {
//                 return null;
//             }

//             const dataToInsert: FeesStructure = {
//                 ...rest,
//                 classId: feesClassSem.id!,
//                 academicYearId: academicYear.id,
//                 courseId: course.id,
//                 advanceForCourseId: advanceForCourse?.id ?? null,
//                 shiftId: shift?.id!,
//             };

//             const [newFeesStructure] = await db
//                 .insert(feesStructureModel)
//                 .values(dataToInsert)
//                 .returning();

//             if (!newFeesStructure) {
//                 return null;
//             }

//             if (components && components.length > 0) {
//                 const newComponents = createFeesStructureDto.components.map((comp) => {
//                     const { id: compId, ...compRest } = comp;
//                     return { ...compRest, feesStructureId: newFeesStructure.id };
//                 });
//                 await db.insert(feesComponentModel).values(newComponents);
//             }

//             // Handle instalments creation
//             if (
//                 createFeesStructureDto.instalments &&
//                 createFeesStructureDto.instalments.length > 0
//             ) {
//                 const newInstalments = createFeesStructureDto.instalments.map(
//                     (inst) => {
//                         const { id: instId, ...instRest } = inst;
//                         // Convert all date fields to Date objects if needed
//                         const dateFields = [
//                             "startDate",
//                             "endDate",
//                             "onlineStartDate",
//                             "onlineEndDate",
//                             "createdAt",
//                             "updatedAt",
//                         ];
//                         for (const field of dateFields) {
//                             if (
//                                 (instRest as any)[field] &&
//                                 !((instRest as any)[field] instanceof Date)
//                             ) {
//                                 (instRest as any)[field] = new Date((instRest as any)[field]);
//                             }
//                         }
//                         return { ...instRest, feesStructureId: newFeesStructure.id };
//                     },
//                 );
//                 await db.insert(instalmentModel).values(newInstalments);
//             }

//             for (const feesSlabMapping of feesSlabMappings) {
//                 feesSlabMapping.feesStructureId = newFeesStructure.id;
//                 console.log("newFeesStructure.id:", newFeesStructure.id);
//                 const { id, ...rest } = feesSlabMapping;
//                 await createFeesSlabMapping({
//                     ...rest,
//                     feesStructureId: newFeesStructure.id,
//                 });
//             }
//         }

//         return true;
//     } catch (error) {
//         console.error("Error creating fees structure:", error);
//         return null;
//     }
// };

// export const updateFeesStructure = async (
//     id: number,
//     feesStructure: FeesStructureDto,
// ) => {
//     try {
//         const {
//             components,
//             academicYear,
//             course,
//             advanceForCourse,
//             class: feesClassSem,
//             shift,
//             createdAt,
//             updatedAt,
//             ...rest
//         } = feesStructure;

//         if (!academicYear?.id || !course?.id) {
//             throw new Error("Academic Year and Course are required.");
//         }

//         const dataToUpdate: FeesStructure = {
//             ...rest,
//             classId: feesClassSem.id!,
//             academicYearId: academicYear.id,
//             courseId: course.id,
//             advanceForCourseId: advanceForCourse?.id ?? null,
//             shiftId: shift?.id!,
//         };

//         const [updatedFeesStructure] = await db
//             .update(feesStructureModel)
//             .set(dataToUpdate)
//             .where(eq(feesStructureModel.id, id))
//             .returning();

//         if (!updatedFeesStructure) return null;

//         // Handle feesComponent update logic
//         if (components) {
//             // Fetch all existing component ids for this structure
//             const existingComponents = await db
//                 .select()
//                 .from(feesComponentModel)
//                 .where(eq(feesComponentModel.feesStructureId, id));
//             const existingComponentIds = existingComponents.map((c) => c.id);
//             const requestComponentIds = components
//                 .filter((c) => c.id)
//                 .map((c) => c.id);

//             // Update or create
//             for (const comp of components) {
//                 if (!comp.id || comp.id === 0) {
//                     // Create new
//                     const { id: compId, ...compRest } = comp;
//                     await db
//                         .insert(feesComponentModel)
//                         .values({ ...compRest, feesStructureId: updatedFeesStructure.id });
//                 } else {
//                     // Update existing
//                     let { createdAt, updatedAt, ...tmpComp } = comp;
//                     await db
//                         .update(feesComponentModel)
//                         .set(tmpComp)
//                         .where(eq(feesComponentModel.id, comp.id));
//                 }
//             }
//             // Delete components not present in request
//             const toDeleteComponentIds = existingComponentIds.filter(
//                 (id) => !requestComponentIds.includes(id),
//             );
//             if (toDeleteComponentIds.length > 0) {
//                 await db
//                     .delete(feesComponentModel)
//                     .where(
//                         and(
//                             eq(feesComponentModel.feesStructureId, id),
//                             inArray(feesComponentModel.id, toDeleteComponentIds),
//                         ),
//                     );
//             }
//         }

//         // Handle feesSlabMappings update logic
//         if (feesStructure.feesSlabMappings) {
//             // Fetch all existing mapping ids for this structure
//             const existingMappings = await db
//                 .select()
//                 .from(feesSlabMappingModel)
//                 .where(eq(feesSlabMappingModel.feesStructureId, id));
//             const existingMappingIds = existingMappings.map((m) => m.id);
//             const requestMappingIds = feesStructure.feesSlabMappings
//                 .filter((m) => m.id)
//                 .map((m) => m.id);

//             // Update or create
//             for (const mapping of feesStructure.feesSlabMappings) {
//                 if (!mapping.id || mapping.id === 0) {
//                     await createFeesSlabMapping({
//                         ...mapping,
//                         feesStructureId: updatedFeesStructure.id,
//                     });
//                 } else {
//                     let { createdAt, updatedAt, ...tmpMapping } = mapping;
//                     await db
//                         .update(feesSlabMappingModel)
//                         .set(tmpMapping)
//                         .where(eq(feesSlabMappingModel.id, mapping.id));
//                 }
//             }
//             // Delete mappings not present in request
//             const toDeleteMappingIds = existingMappingIds.filter(
//                 (id) => !requestMappingIds.includes(id),
//             );
//             if (toDeleteMappingIds.length > 0) {
//                 await db
//                     .delete(feesSlabMappingModel)
//                     .where(
//                         and(
//                             eq(feesSlabMappingModel.feesStructureId, id),
//                             inArray(feesSlabMappingModel.id, toDeleteMappingIds),
//                         ),
//                     );
//             }
//         }

//         // Handle instalments update logic
//         if (feesStructure.instalments) {
//             // Fetch all existing instalment ids for this structure
//             const existingInstalments = await db
//                 .select()
//                 .from(instalmentModel)
//                 .where(eq(instalmentModel.feesStructureId, id));
//             const existingInstalmentIds = existingInstalments.map((i) => i.id);
//             const requestInstalmentIds = feesStructure.instalments
//                 .filter((i) => i.id)
//                 .map((i) => i.id);

//             // Update or create
//             for (const inst of feesStructure.instalments) {
//                 // Convert all date fields to Date objects if needed
//                 const dateFields = [
//                     "startDate",
//                     "endDate",
//                     "onlineStartDate",
//                     "onlineEndDate",
//                     "createdAt",
//                     "updatedAt",
//                 ];
//                 for (const field of dateFields) {
//                     if ((inst as any)[field] && !((inst as any)[field] instanceof Date)) {
//                         (inst as any)[field] = new Date((inst as any)[field]);
//                     }
//                 }
//                 if (!inst.id || inst.id === 0) {
//                     // Create new
//                     const { id: instId, ...instRest } = inst;
//                     await db
//                         .insert(instalmentModel)
//                         .values({ ...instRest, feesStructureId: updatedFeesStructure.id });
//                 } else {
//                     // Update existing
//                     let { createdAt, updatedAt, ...tmpInst } = inst;
//                     await db
//                         .update(instalmentModel)
//                         .set(tmpInst)
//                         .where(eq(instalmentModel.id, inst.id));
//                 }
//             }
//             // Delete instalments not present in request
//             const toDeleteInstalmentIds = existingInstalmentIds.filter(
//                 (id) => !requestInstalmentIds.includes(id),
//             );
//             if (toDeleteInstalmentIds.length > 0) {
//                 await db
//                     .delete(instalmentModel)
//                     .where(
//                         and(
//                             eq(instalmentModel.feesStructureId, id),
//                             inArray(instalmentModel.id, toDeleteInstalmentIds),
//                         ),
//                     );
//             }
//         }

//         return getFeesStructureById(updatedFeesStructure.id);
//     } catch (error) {
//         console.error("Error updating fees structure:", error);
//         return null;
//     }
// };

// export const deleteFeesStructure = async (id: number) => {
//     try {
//         const deletedFeesStructure = await db
//             .delete(feesStructureModel)
//             .where(eq(feesStructureModel.id, id))
//             .returning();
//         return deletedFeesStructure[0];
//     } catch (error) {
//         return null;
//     }
// };

// export async function modelToDto(
//     model: FeesStructure,
// ): Promise<FeesStructureDto | null> {
//     try {
//         const [academicYear] = await db
//             .select()
//             .from(academicYearModel)
//             .where(eq(academicYearModel.id, model.academicYearId));

//         const [course] = await db
//             .select()
//             .from(courseModel)
//             .where(eq(courseModel.id, model.courseId));

//         let advanceForCourse = null;
//         if (model.advanceForCourseId) {
//             const [foundCourse] = await db
//                 .select()
//                 .from(courseModel)
//                 .where(eq(courseModel.id, model.advanceForCourseId));
//             advanceForCourse = foundCourse;
//         }

//         let shift = undefined;
//         if (model.shiftId) {
//             const [foundShift] = await db
//                 .select()
//                 .from(shiftModel)
//                 .where(eq(shiftModel.id, model.shiftId));
//             shift = foundShift;
//         }

//         let components: FeesComponent[] = [];
//         if (model.id) {
//             components = await db
//                 .select()
//                 .from(feesComponentModel)
//                 .where(eq(feesComponentModel.feesStructureId, model.id));
//         }

//         // Fetch instalments for this feesStructure
//         let instalments: Instalment[] = [];
//         if (model.id) {
//             instalments = await db
//                 .select()
//                 .from(instalmentModel)
//                 .where(eq(instalmentModel.feesStructureId, model.id));
//         }

//         if (!academicYear || !course) return null;
//         const feesSlabMappings = await getFeesSlabMappingsByFeesStructureId(
//             model.id!,
//         );
//         const { classId, ...rest } = model;
//         const foundClass = await findClassById(classId);

//         return {
//             ...rest,
//             class: foundClass,
//             academicYear,
//             course,
//             advanceForCourse,
//             components,
//             shift,
//             feesSlabMappings,
//             instalments,
//         };
//     } catch (error) {
//         console.error("Error in modelToDto:", error);
//         return null;
//     }
// }

// // export const getFeesDesignAbstractLevel = async (academicYearId?: number, courseId?: number): Promise<FeesDesignAbstractLevel[]> => {
// //     try {
// //         const conditions = [];
// //         if (academicYearId) {
// //             conditions.push(eq(feesStructureModel.academicYearId, academicYearId));
// //         }
// //         if (courseId) {
// //             conditions.push(eq(feesStructureModel.courseId, courseId));
// //         }

// //         const query = db.select({
// //             academicYear: academicYearModel,
// //             course: courseModel,
// //             semester: classModel.name,
// //             startDate: feesStructureModel.startDate,
// //             endDate: feesStructureModel.endDate,
// //         })
// //         .from(feesStructureModel)
// //         .leftJoin(academicYearModel, eq(feesStructureModel.academicYearId, academicYearModel.id))
// //         .leftJoin(classModel, eq(classModel.id, feesStructureModel.classId))
// //         .leftJoin(courseModel, eq(feesStructureModel.courseId, courseModel.id));

// //         if (conditions.length > 0) {
// //             // @ts-ignore
// //             query.where(and(...conditions));
// //         }

// //         const feesStructures = await query;

// //         const academicYearsMap = new Map<number, FeesDesignAbstractLevel>();

// //         for (const { academicYear, course, semester, startDate, endDate } of feesStructures) {
// //             if (!academicYear || !course) continue;

// //             if (!academicYearsMap.has(academicYear.id)) {
// //                 academicYearsMap.set(academicYear.id, {
// //                     academicYear,
// //                     courses: [],
// //                 });
// //             }

// //             const academicYearData = academicYearsMap.get(academicYear.id)!;
// //             let courseData = academicYearData.courses.find(c => c.id === course.id);

// //             if (!courseData) {
// //                 const batches = await db.select({
// //                     shift: shiftModel.name,
// //                 })
// //                 .from(batchModel)
// //                 .leftJoin(shiftModel, eq(batchModel.shiftId, shiftModel.id))
// //                 .where(eq(batchModel.courseId, course.id));

// //                 courseData = {
// //                     id: course.id,
// //                     name: course.name,
// //                     semesters: [],
// //                     shifts: batches.map(b => b.shift).filter((s): s is string => s !== null),
// //                     startDate: new Date(startDate),
// //                     endDate: new Date(endDate),
// //                 };
// //                 academicYearData.courses.push(courseData);
// //             }

// //             if (courseData && !courseData.semesters.includes(semester)) {
// //                 courseData.semesters.push(semester);
// //             }
// //         }

// //         return Array.from(academicYearsMap.values());
// //     } catch (error) {
// //         console.error(error);
// //         return [];
// //     }
// // };

// export const checkFeesStructureExists = async (
//     academicYearId: number,
//     courseId: number,
//     classId: number,
//     shiftId: number,
//     feesReceiptTypeId: number,
// ): Promise<boolean> => {
//     const [existing] = await db
//         .select()
//         .from(feesStructureModel)
//         .where(
//             and(
//                 eq(feesStructureModel.academicYearId, academicYearId),
//                 eq(feesStructureModel.courseId, courseId),
//                 eq(feesStructureModel.classId, classId),
//                 eq(feesStructureModel.shiftId, shiftId),
//                 eq(feesStructureModel.feesReceiptTypeId, feesReceiptTypeId),
//             ),
//         );
//     return !!existing;
// };

export const getAcademicYearsFromFeesStructures = async () => {
  // Get all fee structures to extract unique academic year IDs
  const allStructures = await db
    .select({ academicYearId: feeStructureModel.academicYearId })
    .from(feeStructureModel);

  // Get unique academic year IDs
  const uniqueAcademicYearIds = Array.from(
    new Set(
      allStructures
        .map((s) => s.academicYearId)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  );

  if (uniqueAcademicYearIds.length === 0) {
    return [];
  }

  // Fetch academic years using the service
  const academicYears = await Promise.all(
    uniqueAcademicYearIds.map((id) =>
      academicYearService.findAcademicYearById(id),
    ),
  );

  // Filter out null values and return
  return academicYears.filter(
    (ay): ay is NonNullable<typeof ay> => ay !== null,
  );
};

/**
 * Checks if the fee structure amounts are unique
 * This function is kept for compatibility but simplified since concession slabs are no longer used
 */
export const checkUniqueFeeStructureAmounts = async (
  academicYearId: number,
  classId: number,
  programCourseIds: number[],
  shiftIds: number[],
  excludeFeeStructureId?: number,
  page: number = 1,
  pageSize: number = 10,
): Promise<{
  isUnique: boolean;
  conflicts: PaginatedResponse<{
    programCourseId: number;
    shiftId: number;
    feeSlabId: number;
    feeSlabName: string;
    conflictingAmount: number;
    conflictingFeeStructureId: number;
    academicYearId: number;
    academicYearName: string | null;
    classId: number;
    className: string | null;
    receiptTypeId: number;
    receiptTypeName: string | null;
  }>;
}> => {
  // Since concession slabs are no longer used, we simply return that there are no conflicts
  // This function is kept for API compatibility but always returns unique
  return {
    isUnique: true,
    conflicts: {
      content: [],
      page,
      pageSize,
      totalPages: 1,
      totalElements: 0,
    },
  };
};
