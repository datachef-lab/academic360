// import { db } from "@/db/index.ts";
// import { BloodGroup, bloodGroupModel } from "../models/bloodGroup.model.ts";
// import { PaginatedResponse } from "@/utils/PaginatedResponse.ts";
// import { count, desc } from "drizzle-orm";

import { db } from "@/db/index.ts";
import { Category, categoryModel } from "../models/category.model.ts";
import { eq } from "drizzle-orm";

export async function addCategory(category: Category) {
  const [newCategory] = await db
    .insert(categoryModel)
    .values(category)
    .returning();

  return newCategory;
}

export async function findCategoryId(id: number): Promise<Category | null> {
  const [foundCategory] = await db
    .select()
    .from(categoryModel)
    .where(eq(categoryModel.id, id));

  if (!foundCategory) {
    return null;
  }

  return foundCategory;
}

export async function findCategoryByType(
  type: string,
): Promise<Category | null> {
  return null;
}

export async function saveCategory(
  id: number,
  category: Category,
): Promise<Category | null> {
  const existingCategory = await findCategoryId(id);

  if (!existingCategory) {
    return null;
  }

  const [updatedCategory] = await db
    .update(categoryModel)
    .set(category)
    .where(eq(categoryModel.id, id))
    .returning();

  return updatedCategory;
}

export async function removeCategory(id: number): Promise<Boolean> {
  const existingCategory = await findCategoryId(id);

  if (!existingCategory) {
    return false;
  }

  // TODO: Remove all the linkages from heatlh table

  // Delete the blood-group
  await db.delete(categoryModel).where(eq(categoryModel.id, +id)).returning();

  return true;
}
