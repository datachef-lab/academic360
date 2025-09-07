import { db } from "@/db/index.js";
import { sportsInfoModel, SportsInfo } from "../models/sports-info.model.js";
import { eq } from "drizzle-orm";
type SportsInfoInsert = typeof sportsInfoModel.$inferInsert;

// CREATE
export async function createSportsInfo(
  data: Omit<SportsInfoInsert, "id" | "createdAt" | "updatedAt">,
) {
  try {
    const result = await db.insert(sportsInfoModel).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Error creating sports info:", error);
    throw error;
  }
}

// UPDATE
export async function updateSportsInfo(
  id: number,
  data: Partial<Omit<SportsInfoInsert, "id" | "createdAt" | "updatedAt">>,
) {
  try {
    const result = await db
      .update(sportsInfoModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sportsInfoModel.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Error updating sports info:", error);
    throw error;
  }
}

// DELETE
export async function deleteSportsInfo(id: number) {
  try {
    const result = await db
      .delete(sportsInfoModel)
      .where(eq(sportsInfoModel.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Error deleting sports info:", error);
    throw error;
  }
}

// READ by ID
export async function getSportsInfoById(id: number) {
  try {
    const result = await db
      .select()
      .from(sportsInfoModel)
      .where(eq(sportsInfoModel.id, id));
    return result[0];
  } catch (error) {
    console.error("Error getting sports info:", error);
    throw error;
  }
}

// READ by Additional Info ID
export async function getSportsInfoByAdditionalInfoId(
  additionalInfoId: number,
) {
  try {
    const result = await db
      .select()
      .from(sportsInfoModel)
      .where(eq(sportsInfoModel.additionalInfoId, additionalInfoId));
    return result;
  } catch (error) {
    console.error("Error getting sports info by additional info id:", error);
    throw error;
  }
}
