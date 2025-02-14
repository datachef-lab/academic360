import { db } from "@/db/index.js";
import { Category, categoryModel } from "@/features/resources/models/category.model.js";
import { eq } from "drizzle-orm";

export async function addCategory(category: Category): Promise<Category | null> {
    const [foundCategory] = await db.insert(categoryModel).values(category).returning();
    return foundCategory;
}

export async function findCategoryById(id: number): Promise<Category | null> {
    const [foundCategory] = await db.select().from(categoryModel).where(eq(categoryModel.id, id));
    return foundCategory;
}

export async function findCategoryByName(name: string): Promise<Category | null> {
    const [foundCategory] = await db.select().from(categoryModel).where(eq(categoryModel.name, name));
    return foundCategory;
}

export async function findCategoryByCode(code: string): Promise<Category | null> {
    const [foundCategory] = await db.select().from(categoryModel).where(eq(categoryModel.code, code));
    return foundCategory;
}