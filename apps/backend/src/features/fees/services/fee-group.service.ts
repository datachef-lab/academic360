import { db } from "@/db";
import {
  feeGroupModel,
  createFeeGroupSchema,
  feeCategoryModel,
  feeSlabModel,
} from "@repo/db/schemas";
import { eq, and, ne } from "drizzle-orm";
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
