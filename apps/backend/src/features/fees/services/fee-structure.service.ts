import { db } from "@/db/index.js";
import {
  CreateFeeStructureDto,
  FeeStructureDto,
  FeeStructureComponentDto,
  FeeStructureConcessionSlabDto,
} from "@repo/db/dtos/fees";
import {
  feeStructureModel,
  FeeStructure,
  feeStructureComponentModel,
  feeStructureConcessionSlabModel,
  feeStructureInstallmentModel,
  receiptTypeModel,
  feeHeadModel,
  feeConcessionSlabModel,
  feeStudentMappingModel,
  feeCategoryPromotionMappingModel,
  feeCategoryModel,
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
} from "drizzle-orm";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import * as academicYearService from "@/features/academics/services/academic-year.service.js";
import * as classService from "@/features/academics/services/class.service.js";
import * as shiftService from "@/features/academics/services/shift.service.js";
import * as programCourseService from "@/features/course-design/services/program-course.service.js";
import * as receiptTypeService from "./receipt-type.service.js";
import * as feeHeadService from "./fee-head.service.js";
import * as feeConcessionSlabService from "./fee-concession-slab.service.js";
import { studentModel, userModel } from "@repo/db/index.js";

type FeeStructureInsert = typeof feeStructureModel.$inferInsert;

/**
 * Ensures default fee-category-promotion-mapping and fee-student-mapping
 * entries exist for all active students matching the given fee structure.
 *
 * Business rules:
 * - Find all promotions (active students) for:
 *   - same academic year (via session -> academicYear)
 *   - same class, program course, shift as the fee structure
 * - For each promotion:
 *   - Ensure a fee-category-promotion-mapping exists for:
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
): Promise<void> {
  if (
    !feeStructure.academicYearId ||
    !feeStructure.classId ||
    !feeStructure.programCourseId ||
    !feeStructure.shiftId
  ) {
    return;
  }

  // Find "General" fee category
  const [generalFeeCategory] = await db
    .select()
    .from(feeCategoryModel)
    .where(eq(feeCategoryModel.name, "General"));

  if (!generalFeeCategory) {
    console.warn(
      "ensureDefaultFeeStudentMappingsForFeeStructure: 'General' fee category not found. Skipping default mappings.",
    );
    return;
  }

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
    return;
  }

  for (const promotion of promotions) {
    // 1. Ensure fee-category-promotion-mapping exists for (promotion)
    const [existingMapping] = await db
      .select()
      .from(feeCategoryPromotionMappingModel)
      .where(
        and(eq(feeCategoryPromotionMappingModel.promotionId, promotion.id)),
      );

    let feeCategoryPromotionMappingId: number;

    if (existingMapping) {
      feeCategoryPromotionMappingId = existingMapping.id!;
    } else {
      const [createdMapping] = await db
        .insert(feeCategoryPromotionMappingModel)
        .values({
          feeCategoryId: generalFeeCategory.id,
          promotionId: promotion.id,
          createdByUserId: userId,
          updatedByUserId: userId,
        })
        .returning();

      if (!createdMapping) {
        // If for some reason insert failed, skip this promotion
        continue;
      }

      feeCategoryPromotionMappingId = createdMapping.id!;
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
            feeStudentMappingModel.feeCategoryPromotionMappingId,
            feeCategoryPromotionMappingId,
          ),
        ),
      );

    if (existingFeeStudentMapping) {
      // Update existing mapping with new feeCategoryPromotionMappingId and totalPayable
      const [feeCategoryPromotionMapping] = await db
        .select()
        .from(feeCategoryPromotionMappingModel)
        .where(
          eq(
            feeCategoryPromotionMappingModel.id,
            feeCategoryPromotionMappingId,
          ),
        );

      if (feeCategoryPromotionMapping) {
        const totalPayable = await calculateTotalPayableForFeeStudentMapping(
          feeStructure.id!,
          feeCategoryPromotionMapping.feeCategoryId,
        );

        await db
          .update(feeStudentMappingModel)
          .set({
            feeCategoryPromotionMappingId,
            totalPayable,
            updatedAt: new Date(),
          })
          .where(eq(feeStudentMappingModel.id, existingFeeStudentMapping.id!));
      }
      continue;
    }

    // Get fee category for the mapping to calculate totalPayable
    const [feeCategoryPromotionMapping] = await db
      .select()
      .from(feeCategoryPromotionMappingModel)
      .where(
        eq(feeCategoryPromotionMappingModel.id, feeCategoryPromotionMappingId),
      );

    let totalPayable = 0;
    if (feeCategoryPromotionMapping) {
      totalPayable = await calculateTotalPayableForFeeStudentMapping(
        feeStructure.id!,
        feeCategoryPromotionMapping.feeCategoryId,
      );
    }

    await db.insert(feeStudentMappingModel).values({
      studentId: promotion.studentId,
      feeStructureId: feeStructure.id!,
      feeCategoryPromotionMappingId,
      totalPayable,
      // Other fields use their database defaults (e.g. type, totals)
    });
  }
}

/**
 * Calculate total payable amount for fee-student-mapping based on:
 * - Fee structure base amount
 * - Fee category's concession slab
 * - Fee structure concession slab's concession rate
 */
export async function calculateTotalPayableForFeeStudentMapping(
  feeStructureId: number,
  feeCategoryId: number,
): Promise<number> {
  // Get fee structure with components
  const [feeStructure] = await db
    .select()
    .from(feeStructureModel)
    .where(eq(feeStructureModel.id, feeStructureId));

  if (!feeStructure || !feeStructure.baseAmount) {
    return 0;
  }

  // Get fee structure components
  const feeStructureComponents = await db
    .select()
    .from(feeStructureComponentModel)
    .where(eq(feeStructureComponentModel.feeStructureId, feeStructureId));

  // Get fee category to get feeConcessionSlabId
  const [feeCategory] = await db
    .select()
    .from(feeCategoryModel)
    .where(eq(feeCategoryModel.id, feeCategoryId));

  if (!feeCategory || !feeCategory.feeConcessionSlabId) {
    // If no concession slab, calculate from components to account for rounding
    if (feeStructureComponents.length > 0) {
      const totalFromComponents = feeStructureComponents.reduce(
        (sum, component) => {
          const componentAmount = Math.round(
            (feeStructure.baseAmount * (component.feeHeadPercentage || 0)) /
              100,
          );
          return sum + componentAmount;
        },
        0,
      );
      return totalFromComponents;
    }
    return Math.round(feeStructure.baseAmount);
  }

  // Get fee structure concession slab for this fee structure and concession slab
  const [feeStructureConcessionSlab] = await db
    .select()
    .from(feeStructureConcessionSlabModel)
    .where(
      and(
        eq(feeStructureConcessionSlabModel.feeStructureId, feeStructureId),
        eq(
          feeStructureConcessionSlabModel.feeConcessionSlabId,
          feeCategory.feeConcessionSlabId,
        ),
      ),
    );

  if (
    !feeStructureConcessionSlab ||
    feeStructureConcessionSlab.concessionRate === undefined
  ) {
    // If no concession slab mapping found, calculate from components
    if (feeStructureComponents.length > 0) {
      const totalFromComponents = feeStructureComponents.reduce(
        (sum, component) => {
          const componentAmount = Math.round(
            (feeStructure.baseAmount * (component.feeHeadPercentage || 0)) /
              100,
          );
          return sum + componentAmount;
        },
        0,
      );
      return totalFromComponents;
    }
    return Math.round(feeStructure.baseAmount);
  }

  const concessionRate = feeStructureConcessionSlab.concessionRate || 0;

  // Calculate total payable from components to account for rounding
  // This matches the frontend calculation in the summary modal
  if (feeStructureComponents.length > 0) {
    const totalFromComponents = feeStructureComponents.reduce(
      (sum, component) => {
        // Calculate component amount (rounded)
        const componentAmount = Math.round(
          (feeStructure.baseAmount * (component.feeHeadPercentage || 0)) / 100,
        );
        // Apply concession (rounded)
        const concessionAmount = Math.round(
          (componentAmount * concessionRate) / 100,
        );
        const totalAfterConcession = componentAmount - concessionAmount;
        return sum + totalAfterConcession;
      },
      0,
    );
    return totalFromComponents;
  }

  // Fallback: Calculate total payable: baseAmount - (baseAmount * concessionRate / 100)
  const concessionAmount = (feeStructure.baseAmount * concessionRate) / 100;
  const totalPayable = feeStructure.baseAmount - concessionAmount;

  return Math.round(totalPayable);
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
        return {
          ...component,
          feeHead: feeHead || null,
        };
      }),
    );

    // Fetch concession slabs
    const concessionSlabs = await db
      .select()
      .from(feeStructureConcessionSlabModel)
      .where(eq(feeStructureConcessionSlabModel.feeStructureId, model.id!));

    const concessionSlabDtos: FeeStructureConcessionSlabDto[] =
      await Promise.all(
        concessionSlabs.map(async (slab) => {
          const feeConcessionSlab =
            await feeConcessionSlabService.getFeeConcessionSlabById(
              slab.feeConcessionSlabId,
            );
          if (!feeConcessionSlab) {
            throw new Error(
              `Fee concession slab not found: ${slab.feeConcessionSlabId}`,
            );
          }
          return {
            ...slab,
            feeConcessionSlab,
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
      feeStructureConcessionSlabs: concessionSlabDtos,
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
  await ensureDefaultFeeStudentMappingsForFeeStructure(created, userId);

  return await modelToDto(created);
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

  // Convert to DTOs
  const dtos = await Promise.all(structures.map((s) => modelToDto(s)));
  const content = dtos.filter((dto): dto is FeeStructureDto => dto !== null);

  return {
    content,
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
        baseAmount: givenDto.baseAmount,
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
      // Step 3: - Add the fee-concession-slabs
      for (let k = 0; k < givenDto.feeStructureConcessionSlabs.length; k++) {
        const concessionSlab = givenDto.feeStructureConcessionSlabs[k];

        await db.insert(feeStructureConcessionSlabModel).values({
          feeStructureId: newFeesStructure.id!,
          feeConcessionSlabId: concessionSlab.feeConcessionSlabId,
          concessionRate: concessionSlab.concessionRate,
        });
      }

      // Step 4: - Add installments if provided
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
      );

      // Convert to DTO and add to results
      const dto = await modelToDto(newFeesStructure);
      if (dto) {
        createdStructures.push(dto);
      }
    }
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
  // Step 1: Check if fee structure exists
  const [existingFeeStructure] = await db
    .select()
    .from(feeStructureModel)
    .where(eq(feeStructureModel.id, feeStructureId));

  if (!existingFeeStructure) {
    return null;
  }

  // Step 2: Update the fee structure itself
  const feeStructureDataToUpdate: Partial<FeeStructure> = {
    academicYearId: givenDto.academicYearId,
    classId: givenDto.classId,
    receiptTypeId: givenDto.receiptTypeId,
    baseAmount: givenDto.baseAmount,
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

  // Step 4: Upsert concession slabs (delete existing and insert new)
  // Delete existing concession slabs
  await db
    .delete(feeStructureConcessionSlabModel)
    .where(eq(feeStructureConcessionSlabModel.feeStructureId, feeStructureId));

  // Insert new concession slabs
  if (
    givenDto.feeStructureConcessionSlabs &&
    givenDto.feeStructureConcessionSlabs.length > 0
  ) {
    for (let k = 0; k < givenDto.feeStructureConcessionSlabs.length; k++) {
      const concessionSlab = givenDto.feeStructureConcessionSlabs[k];
      await db.insert(feeStructureConcessionSlabModel).values({
        feeStructureId: feeStructureId,
        feeConcessionSlabId: concessionSlab.feeConcessionSlabId,
        concessionRate: concessionSlab.concessionRate,
      });
    }
  }

  // Step 5: Upsert installments (delete existing and insert new)
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

  // After updating, ensure default fee-student-mappings exist
  await ensureDefaultFeeStudentMappingsForFeeStructure(
    updatedFeeStructure,
    userId,
  );

  // Convert to DTO and return
  return await modelToDto(updatedFeeStructure);
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
  await ensureDefaultFeeStudentMappingsForFeeStructure(updated, userId);

  return await modelToDto(updated);
};

export const deleteFeeStructure = async (
  id: number,
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
    await tx
      .delete(feeStudentMappingModel)
      .where(eq(feeStudentMappingModel.feeStructureId, id));

    // 2. Delete fee_structure_components
    await tx
      .delete(feeStructureComponentModel)
      .where(eq(feeStructureComponentModel.feeStructureId, id));

    // 3. Delete fee_structure_installments (must be deleted after fee_student_mappings since they reference it)
    await tx
      .delete(feeStructureInstallmentModel)
      .where(eq(feeStructureInstallmentModel.feeStructureId, id));

    // 4. Delete fee_structure_concession_slabs
    await tx
      .delete(feeStructureConcessionSlabModel)
      .where(eq(feeStructureConcessionSlabModel.feeStructureId, id));

    // 5. Finally, delete the fee structure itself
    await tx.delete(feeStructureModel).where(eq(feeStructureModel.id, id));
  });

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
 * Checks if the fee structure amounts are unique for all concession slabs
 * Calculated amounts should be unique across ALL fee structures, regardless of
 * academic year, semester, program courses, or shifts
 */
export const checkUniqueFeeStructureAmounts = async (
  academicYearId: number,
  classId: number,
  programCourseIds: number[],
  shiftIds: number[],
  baseAmount: number,
  feeStructureConcessionSlabs: Array<{
    feeConcessionSlabId: number;
    concessionRate: number;
  }>,
  excludeFeeStructureId?: number, // For edit case, exclude current fee structure
  page: number = 1,
  pageSize: number = 10,
): Promise<{
  isUnique: boolean;
  conflicts: PaginatedResponse<{
    programCourseId: number;
    shiftId: number;
    concessionSlabId: number;
    concessionSlabName: string;
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
  const conflicts: Array<{
    programCourseId: number;
    shiftId: number;
    concessionSlabId: number;
    concessionSlabName: string;
    conflictingAmount: number;
    conflictingFeeStructureId: number;
    academicYearId: number;
    academicYearName: string | null;
    classId: number;
    className: string | null;
    receiptTypeId: number;
    receiptTypeName: string | null;
  }> = [];

  // Use a Set to track unique conflicts
  // Since amounts must be unique globally (regardless of program course, shift, etc.),
  // we group conflicts by concessionSlabId + conflictingAmount only
  // This eliminates redundancy where multiple fee structures have the same amount for the same concession slab
  const uniqueConflictKeys = new Set<string>();

  // Map to store the first conflicting fee structure for each unique conflict
  // Key: concessionSlabId-conflictingAmount, Value: first conflicting fee structure data
  const conflictMap = new Map<
    string,
    {
      programCourseId: number;
      shiftId: number;
      concessionSlabId: number;
      concessionSlabName: string;
      conflictingAmount: number;
      conflictingFeeStructureId: number;
      academicYearId: number;
      academicYearName: string | null;
      classId: number;
      className: string | null;
      receiptTypeId: number;
      receiptTypeName: string | null;
    }
  >();

  // Get all existing fee structures (excluding the current one if editing)
  const conditions = [];
  if (excludeFeeStructureId) {
    conditions.push(not(eq(feeStructureModel.id, excludeFeeStructureId)));

    // Also exclude fee structures that were created in the same batch
    // (same baseAmount, academicYearId, classId, receiptTypeId, and same concession slabs)
    // This prevents conflicts with other fee structures created together during multi-select creation

    // First, get the current fee structure to find its "batch signature"
    const [currentFeeStructure] = await db
      .select()
      .from(feeStructureModel)
      .where(eq(feeStructureModel.id, excludeFeeStructureId));

    if (currentFeeStructure) {
      // Get all concession slabs for the current fee structure
      const currentConcessionSlabs = await db
        .select()
        .from(feeStructureConcessionSlabModel)
        .where(
          eq(
            feeStructureConcessionSlabModel.feeStructureId,
            excludeFeeStructureId,
          ),
        );

      // Find fee structures with the same "batch signature"
      // (same baseAmount, academicYearId, classId, receiptTypeId)
      const batchStructures = await db
        .select()
        .from(feeStructureModel)
        .where(
          and(
            eq(feeStructureModel.baseAmount, currentFeeStructure.baseAmount),
            eq(
              feeStructureModel.academicYearId,
              currentFeeStructure.academicYearId,
            ),
            eq(feeStructureModel.classId, currentFeeStructure.classId),
            eq(
              feeStructureModel.receiptTypeId,
              currentFeeStructure.receiptTypeId,
            ),
            not(eq(feeStructureModel.id, excludeFeeStructureId)),
          ),
        );

      // Check which of these have the same concession slabs
      const batchStructureIds: number[] = [];
      for (const batchStruct of batchStructures) {
        const batchConcessionSlabs = await db
          .select()
          .from(feeStructureConcessionSlabModel)
          .where(
            eq(feeStructureConcessionSlabModel.feeStructureId, batchStruct.id!),
          );

        // Check if they have the same concession slabs (same IDs and rates)
        if (batchConcessionSlabs.length === currentConcessionSlabs.length) {
          const currentSlabsMap = new Map(
            currentConcessionSlabs.map((s) => [
              s.feeConcessionSlabId,
              s.concessionRate,
            ]),
          );
          const batchSlabsMap = new Map(
            batchConcessionSlabs.map((s) => [
              s.feeConcessionSlabId,
              s.concessionRate,
            ]),
          );

          // Check if all slabs match
          let allMatch = true;
          for (const [slabId, rate] of currentSlabsMap) {
            if (batchSlabsMap.get(slabId) !== rate) {
              allMatch = false;
              break;
            }
          }

          if (allMatch) {
            batchStructureIds.push(batchStruct.id!);
          }
        }
      }

      // Exclude all fee structures from the same batch
      if (batchStructureIds.length > 0) {
        conditions.push(notInArray(feeStructureModel.id, batchStructureIds));
      }
    }
  }

  const allExistingStructures = await db
    .select()
    .from(feeStructureModel)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // For each concession slab, calculate final amount and check for conflicts
  for (const slab of feeStructureConcessionSlabs) {
    const concessionAmount = (baseAmount * slab.concessionRate) / 100;
    const finalAmount = baseAmount - concessionAmount;

    // Check ALL existing fee structures (not filtered by academic year, class, program course, or shift)
    for (const existingStructure of allExistingStructures) {
      const existingConcessionSlabs = await db
        .select()
        .from(feeStructureConcessionSlabModel)
        .where(
          eq(
            feeStructureConcessionSlabModel.feeStructureId,
            existingStructure.id!,
          ),
        );

      // Check if any existing slab has the same final amount for the same concession slab
      for (const existingSlab of existingConcessionSlabs) {
        if (existingSlab.feeConcessionSlabId === slab.feeConcessionSlabId) {
          const existingConcessionAmount =
            (existingStructure.baseAmount * existingSlab.concessionRate) / 100;
          const existingFinalAmount =
            existingStructure.baseAmount - existingConcessionAmount;

          // Check if amounts match (with small tolerance for floating point)
          if (Math.abs(existingFinalAmount - finalAmount) < 0.01) {
            // Create a unique key based only on concessionSlabId and amount
            // This ensures we report each unique conflict only once, regardless of how many fee structures have it
            const conflictKey = `${slab.feeConcessionSlabId}-${existingFinalAmount.toFixed(2)}`;

            // Only process if we haven't seen this exact conflict before
            if (!uniqueConflictKeys.has(conflictKey)) {
              uniqueConflictKeys.add(conflictKey);

              // Get concession slab name
              const concessionSlab =
                await feeConcessionSlabService.getFeeConcessionSlabById(
                  slab.feeConcessionSlabId,
                );

              // Fetch related entities for the conflicting fee structure
              const conflictingAcademicYear =
                await academicYearService.findAcademicYearById(
                  existingStructure.academicYearId,
                );
              const conflictingClass = await classService.findClassById(
                existingStructure.classId,
              );
              const conflictingReceiptType =
                await receiptTypeService.getReceiptTypeById(
                  existingStructure.receiptTypeId,
                );

              // Store the first conflicting fee structure for this unique conflict
              conflictMap.set(conflictKey, {
                programCourseId: existingStructure.programCourseId,
                shiftId: existingStructure.shiftId,
                concessionSlabId: slab.feeConcessionSlabId,
                concessionSlabName: concessionSlab?.name || "Unknown",
                conflictingAmount: existingFinalAmount,
                conflictingFeeStructureId: existingStructure.id!,
                academicYearId: existingStructure.academicYearId,
                academicYearName: conflictingAcademicYear?.year || null,
                classId: existingStructure.classId,
                className: conflictingClass?.name || null,
                receiptTypeId: existingStructure.receiptTypeId,
                receiptTypeName: conflictingReceiptType?.name || null,
              });
            }
          }
        }
      }
    }
  }

  // Convert map to array of conflicts
  conflicts.push(...Array.from(conflictMap.values()));

  // Paginate conflicts
  const offset = (page - 1) * pageSize;
  const limit = Math.max(1, Math.min(100, pageSize)); // Limit pageSize between 1 and 100
  const totalElements = conflicts.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / limit));
  const paginatedConflicts = conflicts.slice(offset, offset + limit);

  return {
    isUnique: conflicts.length === 0,
    conflicts: {
      content: paginatedConflicts,
      page,
      pageSize: limit,
      totalPages,
      totalElements,
    },
  };
};
