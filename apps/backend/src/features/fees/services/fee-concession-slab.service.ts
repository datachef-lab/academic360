import { db } from "@/db";
import {
  FeeConcessionSlab,
  feeConcessionSlabModel,
  createFeeConcessionSlabSchema,
} from "@repo/db/schemas";
import { eq } from "drizzle-orm";

/**
 * Services return raw DTOs/arrays/null and do not catch errors.
 * Validation is performed in controllers via zod schemas.
 */
export const createFeeConcessionSlab = async (
  data: FeeConcessionSlab,
): Promise<typeof feeConcessionSlabModel.$inferSelect> => {
  const [created] = await db
    .insert(feeConcessionSlabModel)
    .values(data)
    .returning();
  return created;
};

export const getAllFeeConcessionSlabs = async (): Promise<
  (typeof feeConcessionSlabModel.$inferSelect)[]
> => {
  const slabs = await db.select().from(feeConcessionSlabModel);
  return slabs;
};

export const getFeeConcessionSlabById = async (
  id: number,
): Promise<typeof feeConcessionSlabModel.$inferSelect | null> => {
  const [slab] = await db
    .select()
    .from(feeConcessionSlabModel)
    .where(eq(feeConcessionSlabModel.id, id));

  return slab ?? null;
};

export const updateFeeConcessionSlab = async (
  id: number,
  data: Partial<FeeConcessionSlab>,
): Promise<typeof feeConcessionSlabModel.$inferSelect | null> => {
  const [updated] = await db
    .update(feeConcessionSlabModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(feeConcessionSlabModel.id, id))
    .returning();

  return updated ?? null;
};

export const deleteFeeConcessionSlab = async (
  id: number,
): Promise<typeof feeConcessionSlabModel.$inferSelect | null> => {
  const [deleted] = await db
    .delete(feeConcessionSlabModel)
    .where(eq(feeConcessionSlabModel.id, id))
    .returning();

  return deleted ?? null;
};
