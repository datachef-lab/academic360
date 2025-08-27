"use server";

import {dbPostgres, } from "@/db";
import { boardUniversities, degree } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Define the schema for adding/editing Board Universities (adjust based on your needs)
const boardUniversitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  // Add other fields as necessary based on your boardUniversities schema
  // degreeId: z.number().optional(),
  // passingMarks: z.number().optional(),
  // code: z.string().optional(),
  // addressId: z.number().optional(),
  // sequence: z.number().optional(),
});

export type AddBoardUniversityResult = { success: boolean; message?: string; error?: string };

export async function getDegrees() {
  return await dbPostgres.select().from(degree);
}

export async function addBoardUniversity(formData: FormData): Promise<AddBoardUniversityResult> {
  const data = {
    name: formData.get("name"),
    // Extract other fields from formData
    // degreeId: parseInt(formData.get("degreeId")), // Example for number
  };

  const validation = boardUniversitySchema.safeParse(data);

  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    await dbPostgres.insert(boardUniversities).values(validation.data);
    revalidatePath("/settings/masters/board-universities");
    return { success: true, message: "Board University added successfully." };
  } catch (error) {
    console.error("Error adding Board University:", error);
    return { success: false, error: "Failed to add Board University." };
  }
}

export async function deleteBoardUniversity(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await dbPostgres.delete(boardUniversities).where(eq(boardUniversities.id, id));
    revalidatePath("/settings/masters/board-universities");
    return { success: true, message: "Board University deleted successfully." };
  } catch (error) {
    console.error("Error deleting Board University:", error);
    return { success: false, error: "Failed to delete Board University." };
  }
}

export async function uploadBoardUniversitiesFromFile(formData: FormData): Promise<{ success: boolean; message?: string; error?: string }> {
  // Placeholder for upload logic
  console.log("Upload Board Universities action triggered.", formData);
  revalidatePath("/settings/masters/board-universities");
  return { success: true, message: "Upload action placeholder executed." };
}

export async function downloadBoardUniversities(): Promise<{ success: boolean; message?: string; error?: string }> {
  // Placeholder for download logic
  console.log("Download Board Universities action triggered.");
  return { success: true, message: "Download action placeholder executed." };
} 