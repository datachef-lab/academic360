import {dbPostgres} from "@/db";
import { Category, categories } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";

export async function createCategory(data: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
    const [existingCategory] = await dbPostgres
        .select()
        .from(categories)
        .where(
            ilike(categories.name, data.name)
        );
    if (existingCategory) {
        return existingCategory;
    }

    const [created] = await dbPostgres
        .insert(categories)
        .values(data)
        .returning();

    console.log("created category:", created);
    return created;
}

export async function getAllCategories(): Promise<Category[]> {
    return await dbPostgres.select().from(categories);
}

export async function getCategoryById(id: number): Promise<Category | null> {
    const [found] = await dbPostgres
        .select()
        .from(categories)
        .where(eq(categories.id, id));
    return found || null;
}

export async function updateCategory(id: number, data: Partial<Omit<Category, "id">>): Promise<Category | null> {
    const [updated] = await dbPostgres
        .update(categories)
        .set(data)
        .where(eq(categories.id, id))
        .returning();
    return updated || null;
}

export async function deleteCategory(id: number): Promise<boolean> {
    const result = await dbPostgres
        .delete(categories)
        .where(eq(categories.id, id!));
    return result.length > 0;
}
