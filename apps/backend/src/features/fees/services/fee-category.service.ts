import { db } from "@/db";
import {
  feeCategoryModel,
  createFeeCategorySchema,
  feeConcessionSlabModel,
} from "@repo/db/schemas";
import { eq } from "drizzle-orm";
import { FeeCategoryDto } from "@repo/db/dtos/fees";

/**
 * Converts a FeeCategory model to FeeCategoryDto
 */
async function modelToDto(
  model: typeof feeCategoryModel.$inferSelect | null,
): Promise<FeeCategoryDto | null> {
  if (!model) return null;

  const [feeConcessionSlab] = await db
    .select()
    .from(feeConcessionSlabModel)
    .where(eq(feeConcessionSlabModel.id, model.feeConcessionSlabId));

  return {
    ...model,
    feeConcessionSlab: feeConcessionSlab!,
  };
}

/**
 * Services should accept validated DTOs (controller validates via zod) and
 * return raw rows / arrays / null. Do not catch errors here — controller will handle them.
 */
export const createFeeCategory = async (
  data: Omit<
    typeof createFeeCategorySchema._type,
    "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
  >,
  userId: number,
): Promise<FeeCategoryDto> => {
  const [created] = await db
    .insert(feeCategoryModel)
    .values({
      ...data,
      createdByUserId: userId,
      updatedByUserId: userId,
    })
    .returning();

  const dto = await modelToDto(created);
  return dto!;
};

export const getAllFeeCategories = async (): Promise<FeeCategoryDto[]> => {
  const rows = await db.select().from(feeCategoryModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is FeeCategoryDto => dto !== null);
};

export const getFeeCategoryById = async (
  id: number,
): Promise<FeeCategoryDto | null> => {
  const [row] = await db
    .select()
    .from(feeCategoryModel)
    .where(eq(feeCategoryModel.id, id));

  return await modelToDto(row ?? null);
};

export const updateFeeCategory = async (
  id: number,
  data: Partial<typeof createFeeCategorySchema._type>,
  userId: number,
): Promise<FeeCategoryDto | null> => {
  const [updated] = await db
    .update(feeCategoryModel)
    .set({
      ...data,
      updatedAt: new Date(),
      updatedByUserId: userId,
    })
    .where(eq(feeCategoryModel.id, id))
    .returning();

  return await modelToDto(updated ?? null);
};

export const deleteFeeCategory = async (
  id: number,
): Promise<FeeCategoryDto | null> => {
  const [deleted] = await db
    .delete(feeCategoryModel)
    .where(eq(feeCategoryModel.id, id))
    .returning();

  return await modelToDto(deleted ?? null);
};
