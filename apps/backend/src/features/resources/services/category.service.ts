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

export async function findAllCategories(): Promise<Category[]> {
    return await db.select().from(categoryModel).orderBy(categoryModel.sequence);
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const [newCategory] = await db
        .insert(categoryModel)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();
    
    return newCategory;
}

export async function updateCategory(id: number, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category | null> {
    const [updatedCategory] = await db
        .update(categoryModel)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(categoryModel.id, id))
        .returning();
    
    return updatedCategory || null;
}

export async function deleteCategory(id: number): Promise<Category | null> {
    const [deletedCategory] = await db
        .delete(categoryModel)
        .where(eq(categoryModel.id, id))
        .returning();
    
    return deletedCategory || null;
}

export async function findCategoryByName(name: string): Promise<Category | null> {
    const [foundCategory] = await db.select().from(categoryModel).where(eq(categoryModel.name, name));
    return foundCategory;
}

export async function findCategoryByCode(code: string): Promise<Category | null> {
    const [foundCategory] = await db.select().from(categoryModel).where(eq(categoryModel.code, code));
    return foundCategory;
}