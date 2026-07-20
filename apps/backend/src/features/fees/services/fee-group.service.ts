import { db } from "@/db";
import {
  feeGroupModel,
  createFeeGroupSchema,
  feeCategoryModel,
  feeSlabModel,
  promotionModel,
  sessionModel,
  feeStructureModel,
  feeStructureComponentModel,
} from "@repo/db/schemas";
import { eq, and, or, ne, inArray, sql } from "drizzle-orm";
import { FeeGroupDto } from "@repo/db/dtos/fees";

/**
 * Converts a FeeGroup model to FeeGroupDto
 */
async function modelToDto(
  model: typeof feeGroupModel.$inferSelect | null,
): Promise<FeeGroupDto | null> {
  if (!model) return null;

  const [feeCategory] = await db
    .select()
    .from(feeCategoryModel)
    .where(eq(feeCategoryModel.id, model.feeCategoryId));

  const [feeSlab] = await db
    .select()
    .from(feeSlabModel)
    .where(eq(feeSlabModel.id, model.feeSlabId));

  if (!feeCategory || !feeSlab) return null;

  return {
    ...model,
    feeCategory,
    feeSlab,
  };
}

/**
 * Check if a fee group with the same feeCategoryId and feeSlabId already exists
 */
async function checkDuplicateFeeGroup(
  feeCategoryId: number,
  feeSlabId: number,
  excludeId?: number,
): Promise<boolean> {
  const existing = await db
    .select()
    .from(feeGroupModel)
    .where(
      excludeId
        ? and(
            eq(feeGroupModel.feeCategoryId, feeCategoryId),
            eq(feeGroupModel.feeSlabId, feeSlabId),
            ne(feeGroupModel.id, excludeId), // Exclude the current record
          )
        : and(
            eq(feeGroupModel.feeCategoryId, feeCategoryId),
            eq(feeGroupModel.feeSlabId, feeSlabId),
          ),
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * Check if a fee slab is already used in any fee group (irrespective of category)
 */
async function checkDuplicateSlab(
  feeSlabId: number,
  excludeId?: number,
): Promise<boolean> {
  const existing = await db
    .select()
    .from(feeGroupModel)
    .where(
      excludeId
        ? and(
            eq(feeGroupModel.feeSlabId, feeSlabId),
            ne(feeGroupModel.id, excludeId),
          )
        : eq(feeGroupModel.feeSlabId, feeSlabId),
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * Services should accept validated DTOs (controller validates via zod) and
 * return raw rows / arrays / null. Do not catch errors here — controller will handle them.
 */
export const createFeeGroup = async (
  data: Omit<
    typeof createFeeGroupSchema._type,
    "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
  >,
  userId: number,
): Promise<FeeGroupDto | null> => {
  // Check if the fee slab is already used (irrespective of category)
  const slabDuplicateExists = await checkDuplicateSlab(data.feeSlabId);
  if (slabDuplicateExists) {
    return null; // Return null to indicate duplicate slab
  }

  // Check for duplicate feeCategoryId + feeSlabId combination
  const duplicateExists = await checkDuplicateFeeGroup(
    data.feeCategoryId,
    data.feeSlabId,
  );
  if (duplicateExists) {
    return null; // Return null to indicate duplicate combination
  }

  const [created] = await db
    .insert(feeGroupModel)
    .values({
      ...data,
      createdByUserId: userId,
      updatedByUserId: userId,
    })
    .returning();

  const dto = await modelToDto(created);
  return dto!;
};

export const getAllFeeGroups = async (): Promise<FeeGroupDto[]> => {
  const rows = await db.select().from(feeGroupModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is FeeGroupDto => dto !== null);
};

export const getFeeGroupById = async (
  id: number,
): Promise<FeeGroupDto | null> => {
  const [row] = await db
    .select()
    .from(feeGroupModel)
    .where(eq(feeGroupModel.id, id));

  return await modelToDto(row ?? null);
};

export const updateFeeGroup = async (
  id: number,
  data: Partial<typeof createFeeGroupSchema._type>,
  userId: number,
): Promise<FeeGroupDto | null> => {
  // If feeSlabId is being updated, check if the slab is already used
  if (data.feeSlabId !== undefined) {
    // Get the current fee group from the database directly (not DTO) to get IDs
    const [currentRow] = await db
      .select()
      .from(feeGroupModel)
      .where(eq(feeGroupModel.id, id))
      .limit(1);

    if (!currentRow) {
      return null; // Fee group doesn't exist
    }

    const finalFeeSlabId = data.feeSlabId;

    // Check if the slab is already used in another fee group (excluding current)
    const slabDuplicateExists = await checkDuplicateSlab(finalFeeSlabId, id);
    if (slabDuplicateExists) {
      return null; // Return null to indicate duplicate slab
    }
  }

  // If feeCategoryId or feeSlabId is being updated, check for duplicate combinations
  if (data.feeCategoryId !== undefined || data.feeSlabId !== undefined) {
    // Get the current fee group from the database directly (not DTO) to get IDs
    const [currentRow] = await db
      .select()
      .from(feeGroupModel)
      .where(eq(feeGroupModel.id, id))
      .limit(1);

    if (!currentRow) {
      return null; // Fee group doesn't exist
    }

    const finalFeeCategoryId = data.feeCategoryId ?? currentRow.feeCategoryId;
    const finalFeeSlabId = data.feeSlabId ?? currentRow.feeSlabId;

    // Check for duplicate combination excluding the current record
    const duplicateExists = await checkDuplicateFeeGroup(
      finalFeeCategoryId,
      finalFeeSlabId,
      id,
    );
    if (duplicateExists) {
      return null; // Return null to indicate duplicate combination
    }
  }

  const [updated] = await db
    .update(feeGroupModel)
    .set({
      ...data,
      updatedAt: new Date(),
      updatedByUserId: userId,
    })
    .where(eq(feeGroupModel.id, id))
    .returning();

  return await modelToDto(updated ?? null);
};

export const deleteFeeGroup = async (
  id: number,
): Promise<FeeGroupDto | null> => {
  const [deleted] = await db
    .delete(feeGroupModel)
    .where(eq(feeGroupModel.id, id))
    .returning();

  return await modelToDto(deleted ?? null);
};

export type FeeGroupTotalForPromotion = {
  feeGroupId: number;
  totalPayable: number;
};

type FeeStructureKey = {
  academicYearId: number;
  classId: number;
  programCourseId: number;
  shiftId: number;
};

/** Fee-group totals depend only on the promotion's fee-structure context, never on the promotion itself. */
function feeStructureKeyOf(k: FeeStructureKey): string {
  return `${k.academicYearId}:${k.classId}:${k.programCourseId}:${k.shiftId}`;
}

export const getFeeGroupTotalsForPromotions = async (
  promotionIds: number[],
  options?: { feeCategoryId?: number },
): Promise<Map<number, FeeGroupTotalForPromotion[]>> => {
  const totalsByPromotionId = new Map<number, FeeGroupTotalForPromotion[]>();
  if (promotionIds.length === 0) return totalsByPromotionId;

  const promotionRows = await db
    .select({
      promotionId: promotionModel.id,
      classId: promotionModel.classId,
      programCourseId: promotionModel.programCourseId,
      shiftId: promotionModel.shiftId,
      academicYearId: sessionModel.academicYearId,
    })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .where(inArray(promotionModel.id, promotionIds));

  const keyByPromotionId = new Map<number, string>();
  const distinctKeys = new Map<string, FeeStructureKey>();

  for (const row of promotionRows) {
    if (
      row.promotionId == null ||
      !row.academicYearId ||
      !row.classId ||
      !row.programCourseId ||
      !row.shiftId
    ) {
      continue;
    }
    const key: FeeStructureKey = {
      academicYearId: row.academicYearId,
      classId: row.classId,
      programCourseId: row.programCourseId,
      shiftId: row.shiftId,
    };
    const keyId = feeStructureKeyOf(key);
    keyByPromotionId.set(row.promotionId, keyId);
    if (!distinctKeys.has(keyId)) distinctKeys.set(keyId, key);
  }

  if (distinctKeys.size === 0) return totalsByPromotionId;

  const feeGroupsQuery = db
    .select({ id: feeGroupModel.id, feeSlabId: feeGroupModel.feeSlabId })
    .from(feeGroupModel);

  const [feeStructures, feeGroups] = await Promise.all([
    db
      .select({
        id: feeStructureModel.id,
        academicYearId: feeStructureModel.academicYearId,
        classId: feeStructureModel.classId,
        programCourseId: feeStructureModel.programCourseId,
        shiftId: feeStructureModel.shiftId,
      })
      .from(feeStructureModel)
      .where(
        or(
          ...[...distinctKeys.values()].map((k) =>
            and(
              eq(feeStructureModel.academicYearId, k.academicYearId),
              eq(feeStructureModel.classId, k.classId),
              eq(feeStructureModel.programCourseId, k.programCourseId),
              eq(feeStructureModel.shiftId, k.shiftId),
            ),
          ),
        ),
      ),
    typeof options?.feeCategoryId === "number" &&
    Number.isFinite(options.feeCategoryId)
      ? feeGroupsQuery.where(
          eq(feeGroupModel.feeCategoryId, options.feeCategoryId),
        )
      : feeGroupsQuery,
  ]);

  const keyByStructureId = new Map<number, string>();
  for (const s of feeStructures) {
    if (
      s.id == null ||
      !s.academicYearId ||
      !s.classId ||
      !s.programCourseId ||
      !s.shiftId
    ) {
      continue;
    }
    keyByStructureId.set(
      s.id,
      feeStructureKeyOf({
        academicYearId: s.academicYearId,
        classId: s.classId,
        programCourseId: s.programCourseId,
        shiftId: s.shiftId,
      }),
    );
  }

  const structureIds = [...keyByStructureId.keys()];
  const componentRows =
    structureIds.length > 0
      ? await db
          .select({
            feeStructureId: feeStructureComponentModel.feeStructureId,
            feeSlabId: feeStructureComponentModel.feeSlabId,
            total: sql<number>`COALESCE(SUM(${feeStructureComponentModel.amount}), 0)`,
          })
          .from(feeStructureComponentModel)
          .where(
            inArray(feeStructureComponentModel.feeStructureId, structureIds),
          )
          .groupBy(
            feeStructureComponentModel.feeStructureId,
            feeStructureComponentModel.feeSlabId,
          )
      : [];

  // Sum across every fee structure belonging to the same context, as the per-promotion query did.
  const slabTotalsByKey = new Map<string, Map<number, number>>();
  for (const row of componentRows) {
    const keyId = keyByStructureId.get(row.feeStructureId);
    if (!keyId || typeof row.feeSlabId !== "number") continue;
    let slabTotals = slabTotalsByKey.get(keyId);
    if (!slabTotals) {
      slabTotals = new Map<number, number>();
      slabTotalsByKey.set(keyId, slabTotals);
    }
    slabTotals.set(
      row.feeSlabId,
      (slabTotals.get(row.feeSlabId) ?? 0) + Number(row.total || 0),
    );
  }

  /** Only slabs present in the context's fee-structure components (excludes global slabs like M/S if unused). */
  const totalsByKey = new Map<string, FeeGroupTotalForPromotion[]>();
  for (const [keyId, slabTotals] of slabTotalsByKey) {
    totalsByKey.set(
      keyId,
      feeGroups
        .filter(
          (g) =>
            typeof g.id === "number" &&
            typeof g.feeSlabId === "number" &&
            slabTotals.has(g.feeSlabId),
        )
        .map((g) => ({
          feeGroupId: g.id as number,
          totalPayable: Math.round(slabTotals.get(g.feeSlabId as number) ?? 0),
        })),
    );
  }

  for (const [promotionId, keyId] of keyByPromotionId) {
    totalsByPromotionId.set(promotionId, totalsByKey.get(keyId) ?? []);
  }

  return totalsByPromotionId;
};

/**
 * For a given promotion (student session/class/program/shift), compute total payable per fee-group.
 *
 * Logic:
 * - Find matching fee structures for the promotion context (ac.y, class, programCourse, shift)
 * - Sum fee structure component amounts grouped by slab (feeSlabId) across all matching structures
 * - Map slab totals to fee groups via feeGroup.feeSlabId
 */
export const getFeeGroupTotalsForPromotion = async (
  promotionId: number,
  options?: { feeCategoryId?: number },
): Promise<FeeGroupTotalForPromotion[]> => {
  const totals = await getFeeGroupTotalsForPromotions([promotionId], options);
  return totals.get(promotionId) ?? [];
};
