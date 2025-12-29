import { db } from "@/db/index.js";
import { receiptTypeModel, ReceiptType } from "@repo/db/schemas/models/fees";
import { eq } from "drizzle-orm";

type ReceiptTypeInsert = typeof receiptTypeModel.$inferInsert;

export const createReceiptType = async (
  data: Omit<ReceiptTypeInsert, "id" | "createdAt" | "updatedAt">,
): Promise<ReceiptType | null> => {
  const [created] = await db.insert(receiptTypeModel).values(data).returning();
  return created || null;
};

export const getAllReceiptTypes = async (): Promise<ReceiptType[]> => {
  return db.select().from(receiptTypeModel);
};

export const getReceiptTypeById = async (
  id: number,
): Promise<ReceiptType | null> => {
  const [found] = await db
    .select()
    .from(receiptTypeModel)
    .where(eq(receiptTypeModel.id, id));
  return found || null;
};

export const updateReceiptType = async (
  id: number,
  data: Partial<ReceiptType>,
): Promise<ReceiptType | null> => {
  const [updated] = await db
    .update(receiptTypeModel)
    .set(data)
    .where(eq(receiptTypeModel.id, id))
    .returning();
  return updated || null;
};

export const deleteReceiptType = async (
  id: number,
): Promise<ReceiptType | null> => {
  const [deleted] = await db
    .delete(receiptTypeModel)
    .where(eq(receiptTypeModel.id, id))
    .returning();
  return deleted || null;
};
