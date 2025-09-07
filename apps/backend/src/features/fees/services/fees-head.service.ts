import { db } from "@/db/index.js";
import { feesHeadModel, FeesHead } from "../models/fees-head.model.js";
// import { FeesHead } from "../types/fees-head";
import { eq } from "drizzle-orm";

export const getFeesHeads = async () => {
  try {
    const feesHeads = await db.select().from(feesHeadModel);
    return feesHeads;
  } catch (error) {
    return null;
  }
};

export const getFeesHeadById = async (id: number) => {
  try {
    const feesHead = await db
      .select()
      .from(feesHeadModel)
      .where(eq(feesHeadModel.id, id));
    return feesHead[0];
  } catch (error) {
    return null;
  }
};

export const createFeesHead = async (feesHead: FeesHead) => {
  try {
    const newFeesHead = await db
      .insert(feesHeadModel)
      .values(feesHead)
      .returning();
    return newFeesHead[0];
  } catch (error) {
    return null;
  }
};

export const updateFeesHead = async (id: number, feesHead: FeesHead) => {
  try {
    const updatedFeesHead = await db
      .update(feesHeadModel)
      .set(feesHead)
      .where(eq(feesHeadModel.id, id))
      .returning();
    return updatedFeesHead[0];
  } catch (error) {
    return null;
  }
};

export const deleteFeesHead = async (id: number) => {
  try {
    const deletedFeesHead = await db
      .delete(feesHeadModel)
      .where(eq(feesHeadModel.id, id))
      .returning();
    return deletedFeesHead[0];
  } catch (error) {
    return null;
  }
};
