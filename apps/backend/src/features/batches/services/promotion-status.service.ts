import { db } from "@/db/index.js";
import {
  promotionStatusModel,
  promotionStatusInsertSchema,
} from "@repo/db/schemas";
import { asc, eq } from "drizzle-orm";

type PromotionStatusInsert = typeof promotionStatusInsertSchema._type;

export async function findAllPromotionStatuses(opts?: { isActive?: boolean }) {
  const where =
    opts?.isActive === undefined
      ? undefined
      : eq(promotionStatusModel.isActive, opts.isActive);

  return db
    .select()
    .from(promotionStatusModel)
    .where(where)
    .orderBy(asc(promotionStatusModel.name));
}

export async function findPromotionStatusById(id: number) {
  const [row] = await db
    .select()
    .from(promotionStatusModel)
    .where(eq(promotionStatusModel.id, id));
  return row ?? null;
}

export async function createPromotionStatus(data: PromotionStatusInsert) {
  const [created] = await db
    .insert(promotionStatusModel)
    .values(data)
    .returning();
  return created ?? null;
}

export async function updatePromotionStatus(
  id: number,
  data: Partial<PromotionStatusInsert>,
) {
  const [updated] = await db
    .update(promotionStatusModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(promotionStatusModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deletePromotionStatus(id: number): Promise<boolean> {
  const [del] = await db
    .delete(promotionStatusModel)
    .where(eq(promotionStatusModel.id, id))
    .returning({ id: promotionStatusModel.id });
  return !!del;
}
