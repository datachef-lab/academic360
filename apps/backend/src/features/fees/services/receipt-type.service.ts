import { db } from "@/db/index.js";
import { receiptTypeModel, ReceiptType } from "@repo/db/schemas/models/fees";
import { eq } from "drizzle-orm";

export const createReceiptType = async (
  data: Omit<ReceiptType, "id" | "createdAt" | "updatedAt">,
) => {
  const [created] = await db
    .insert(receiptTypeModel)
    .values(data as any)
    .returning();
  return created || null;
};

export const getAllReceiptTypes = async () => {
  return db.select().from(receiptTypeModel);
};

export const getReceiptTypeById = async (id: number) => {
  const [found] = await db
    .select()
    .from(receiptTypeModel)
    .where(eq(receiptTypeModel.id, id));
  return found || null;
};

export const updateReceiptType = async (
  id: number,
  data: Partial<ReceiptType>,
) => {
  const [updated] = await db
    .update(receiptTypeModel)
    .set(data)
    .where(eq(receiptTypeModel.id, id))
    .returning();
  return updated || null;
};

export const deleteReceiptType = async (id: number) => {
  const [deleted] = await db
    .delete(receiptTypeModel)
    .where(eq(receiptTypeModel.id, id))
    .returning();
  return deleted || null;
};
// import { db } from "@/db/index.js";
// import {
//   feesReceiptTypeModel,
//   FeesReceiptType,
// } from "../models/fees-receipt-type.model.js";
// // import { FeesReceiptType } from "../types/fees-receipt-type";
// import { eq } from "drizzle-orm";

// export const getFeesReceiptTypes = async () => {
//   try {
//     const feesReceiptTypes = await db.select().from(feesReceiptTypeModel);
//     return feesReceiptTypes;
//   } catch (error) {
//     return null;
//   }
// };

// export const getFeesReceiptTypeById = async (id: number) => {
//   try {
//     const feesReceiptType = await db
//       .select()
//       .from(feesReceiptTypeModel)
//       .where(eq(feesReceiptTypeModel.id, id));
//     return feesReceiptType[0];
//   } catch (error) {
//     return null;
//   }
// };

// export const createFeesReceiptType = async (
//   feesReceiptType: FeesReceiptType,
// ) => {
//   try {
//     const newFeesReceiptType = await db
//       .insert(feesReceiptTypeModel)
//       .values(feesReceiptType)
//       .returning();
//     return newFeesReceiptType[0];
//   } catch (error) {
//     return null;
//   }
// };

// export const updateFeesReceiptType = async (
//   id: number,
//   feesReceiptType: FeesReceiptType,
// ) => {
//   try {
//     const updatedFeesReceiptType = await db
//       .update(feesReceiptTypeModel)
//       .set(feesReceiptType)
//       .where(eq(feesReceiptTypeModel.id, id))
//       .returning();
//     return updatedFeesReceiptType[0];
//   } catch (error) {
//     return null;
//   }
// };

// export const deleteFeesReceiptType = async (id: number) => {
//   try {
//     const deletedFeesReceiptType = await db
//       .delete(feesReceiptTypeModel)
//       .where(eq(feesReceiptTypeModel.id, id))
//       .returning();
//     return deletedFeesReceiptType[0];
//   } catch (error) {
//     return null;
//   }
// };
