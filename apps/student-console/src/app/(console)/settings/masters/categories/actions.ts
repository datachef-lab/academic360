"use server";

import {dbPostgres} from "@/db";
import { categories, Category } from "@/db/schema";
import { createCategory, getAllCategories, updateCategory } from "@/lib/services/category.service";
import { ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";


// Placeholder types and functions for Categories
export type AddCategoryResult = { success: boolean; message?: string; error?: string, category: Category };

export async function addCategory(formData: FormData): Promise<AddCategoryResult> {
    console.log("Add Category action triggered.", formData);
    const id = formData.get("id");
    const categoryData = {
        name: formData.get("name") as string,
        code: formData.get("code") as string,
        documentRequired: formData.get("documentRequired") === "true" ? true : false,
    };
    let category;
    if (id) {
        category = await updateCategory(Number(id), categoryData);
        if (!category) {
            return { success: false, error: "Category not found.", category: null as any };
        }
        return { success: true, message: "Category updated successfully.", category };
    } else {
        category = await createCategory(categoryData);
        return { success: true, message: "Category added successfully.", category };
    }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    console.log("Delete Category action triggered for ID:", id);
    // Simulate success
    revalidatePath("/settings/masters/categories");
    return { success: true, message: "Category deleted successfully (placeholder)." };
}

export async function fetchCategories(): Promise<Category[]> {
    return await getAllCategories();
}

export async function uploadCategoriesFromFile(formData: FormData): Promise<{ success: boolean; message?: string; error?: string }> {
    console.log("Upload Categories action triggered.", formData);
    // Simulate success
    revalidatePath("/settings/masters/categories");
    return { success: true, message: "Upload action placeholder executed." };
}

export async function downloadCategories(): Promise<{ success: boolean; message?: string; error?: string }> {
    console.log("Download Categories action triggered.");
    // Simulate success
    return { success: true, message: "Download action placeholder executed." };
} 