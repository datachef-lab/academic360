import { db } from "@/db/index.js";
import { sportsCategoryModel, SportsCategory } from "../models/sports-category.model.js";
import { eq } from "drizzle-orm";

// CREATE
export async function createSportCategory(givenSportCategory: Omit<SportsCategory, 'id'>) {
  const [newCategory] = await db
    .insert(sportsCategoryModel)
    .values(givenSportCategory)
    .returning();
  return newCategory;
}

// READ all
export async function getAllSportCategories() {
  return await db.select().from(sportsCategoryModel);
}

// READ by ID
export async function getSportCategoryById(id: number) {
  const [category] = await db
    .select()
    .from(sportsCategoryModel)
    .where(eq(sportsCategoryModel.id, id));
  return category || null;
}

// UPDATE
export async function updateSportCategory(id: number, update: Partial<Omit<SportsCategory, 'id'>>) {
  const [updated] = await db
    .update(sportsCategoryModel)
    .set(update)
    .where(eq(sportsCategoryModel.id, id))
    .returning();
  return updated;
}

// SOFT DELETE (disable)
export async function deleteSportCategory(id: number) {
  const [updated] = await db
    .update(sportsCategoryModel)
    .set({ disabled: true })
    .where(eq(sportsCategoryModel.id, id))
    .returning();
  return !!updated;
}

// ENABLE
export async function enableSportCategory(id: number) {
  const [updated] = await db
    .update(sportsCategoryModel)
    .set({ disabled: false })
    .where(eq(sportsCategoryModel.id, id))
    .returning();
  return !!updated;
}
