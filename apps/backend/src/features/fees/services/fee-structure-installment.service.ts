import { db } from "@/db/index.js";
import {
  feeStructureInstallmentModel,
  FeeStructureInstallment,
} from "@repo/db/schemas/models/fees";
import { eq } from "drizzle-orm";

export const createFeeStructureInstallment = async (
  instalment: Omit<FeeStructureInstallment, "id">,
) => {
  const [created] = await db
    .insert(feeStructureInstallmentModel)
    .values(instalment)
    .returning();
  return created || null;
};

export const getFeeStructureInstallmentById = async (id: number) => {
  const [instalment] = await db
    .select()
    .from(feeStructureInstallmentModel)
    .where(eq(feeStructureInstallmentModel.id, id));
  return instalment || null;
};

export const getFeeStructureInstallmentsByFeeStructureId = async (
  feeStructureId: number,
) => {
  return db
    .select()
    .from(feeStructureInstallmentModel)
    .where(eq(feeStructureInstallmentModel.feeStructureId, feeStructureId));
};

export const updateFeeStructureInstallment = async (
  id: number,
  data: Partial<FeeStructureInstallment>,
) => {
  const [updated] = await db
    .update(feeStructureInstallmentModel)
    .set(data)
    .where(eq(feeStructureInstallmentModel.id, id))
    .returning();
  return updated || null;
};

export const deleteFeeStructureInstallment = async (id: number) => {
  const [deleted] = await db
    .delete(feeStructureInstallmentModel)
    .where(eq(feeStructureInstallmentModel.id, id))
    .returning();
  return deleted || null;
};

export const getAllFeeStructureInstallments = async () => {
  return db.select().from(feeStructureInstallmentModel);
};
