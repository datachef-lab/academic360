"use server";

import { dbPostgres } from "@/db";
import { Degree, degree, degreeLevelType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as XLSX from "xlsx";

const degreeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  level: z.string().min(1, "Level is required"),
  sequence: z.coerce.number().optional(),
});

const allowedLevels = degreeLevelType.enumValues;

export type AddDegreeResult = { success: boolean; message?: string; error?: string };

export async function getDegrees() {
  return await dbPostgres.select().from(degree).where(eq(degree.disabled, false));
}

export async function addDegree(formData: FormData): Promise<AddDegreeResult> {
  const data = {
    name: formData.get("name"),
    level: formData.get("level"),
    sequence: formData.get("sequence") ? Number(formData.get("sequence")) : undefined,
  };
  if (!allowedLevels.includes(data.level as typeof degreeLevelType.enumValues[number])) {
    return { success: false, error: "Invalid degree level." };
  }
  const validation = degreeSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }
  try {
    await dbPostgres.insert(degree).values({
      ...validation.data,
      level: validation.data.level as any,
    });
    revalidatePath("/settings/masters/degrees");
    return { success: true, message: "Degree added successfully." };
  } catch (error) {
    console.error("Error adding Degree:", error);
    return { success: false, error: "Failed to add Degree." };
  }
}

export async function updateDegree(id: number, data: { name: any; level: any; sequence?: number }): Promise<AddDegreeResult> {
  if (!allowedLevels.includes(data.level as typeof degreeLevelType.enumValues[number])) {
    return { success: false, error: "Invalid degree level." };
  }
  const validation = degreeSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }
  try {
    await dbPostgres.update(degree).set({
      ...validation.data,
      level: validation.data.level as any,
    }).where(eq(degree.id, id));
    revalidatePath("/settings/masters/degrees");
    return { success: true, message: "Degree updated successfully." };
  } catch (error) {
    console.error("Error updating Degree:", error);
    return { success: false, error: "Failed to update Degree." };
  }
}

export async function deleteDegree(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await dbPostgres.update(degree).set({ disabled: true }).where(eq(degree.id, id));
    revalidatePath("/settings/masters/degrees");
    return { success: true, message: "Degree deleted successfully." };
  } catch (error) {
    console.error("Error deleting Degree:", error);
    return { success: false, error: "Failed to delete Degree." };
  }
}

export async function uploadDegreesFromFile(formData: FormData): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const file = formData.get("file");
    if (!file) return { success: false, error: "No file uploaded." };
    const arrayBuffer = await (file as File).arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(sheet);
    const validDegrees = json.map(row => ({
      name: row["Name"] || row["name"],
      level: row["Level"] || row["level"],
      sequence: row["Sequence"] || row["sequence"]
    })).filter(d => d.name && d.level);
    await dbPostgres.insert(degree).values(validDegrees);
    revalidatePath("/settings/masters/degrees");
    return { success: true, message: "Degrees uploaded successfully." };
  } catch (error) {
    console.error("Error uploading Degrees:", error);
    return { success: false, error: "Failed to upload Degrees." };
  }
}

export async function downloadDegrees(): Promise<Blob> {
  const degrees = await dbPostgres.select().from(degree).where(eq(degree.disabled, false));
  const ws = XLSX.utils.json_to_sheet(degrees);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Degrees");
  const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
} 