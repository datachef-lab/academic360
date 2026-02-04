import { db } from "@/db";
import { feeHeadModel, createFeeHeadSchema } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

/**
 * Services should accept validated DTOs (controller validates via zod) and
 * return raw rows / arrays / null. Do not catch errors here — controller will handle them.
 */

export const createFeeHead = async (
  data: Omit<
    typeof createFeeHeadSchema._type,
    "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
  >,
  userId: number,
): Promise<typeof feeHeadModel.$inferSelect> => {
  const [created] = await db
    .insert(feeHeadModel)
    .values({
      ...data,
      createdByUserId: userId,
      updatedByUserId: userId,
    })
    .returning();
  return created;
};

export const getAllFeeHeads = async (): Promise<
  (typeof feeHeadModel.$inferSelect)[]
> => {
  const rows = await db.select().from(feeHeadModel);
  return rows;
};

export const getFeeHeadById = async (
  id: number,
): Promise<typeof feeHeadModel.$inferSelect | null> => {
  const [row] = await db
    .select()
    .from(feeHeadModel)
    .where(eq(feeHeadModel.id, id));
  return row ?? null;
};

export const updateFeeHead = async (
  id: number,
  data: Partial<typeof createFeeHeadSchema._type>,
  userId: number,
): Promise<typeof feeHeadModel.$inferSelect | null> => {
  const [updated] = await db
    .update(feeHeadModel)
    .set({
      ...data,
      updatedAt: new Date(),
      updatedByUserId: userId,
    })
    .where(eq(feeHeadModel.id, id))
    .returning();
  return updated ?? null;
};

export const deleteFeeHead = async (
  id: number,
): Promise<typeof feeHeadModel.$inferSelect | null> => {
  const [deleted] = await db
    .delete(feeHeadModel)
    .where(eq(feeHeadModel.id, id))
    .returning();
  return deleted ?? null;
};
