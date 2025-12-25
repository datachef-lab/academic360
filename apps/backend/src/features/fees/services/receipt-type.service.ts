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
