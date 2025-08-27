"use server";

import {dbPostgres } from "@/db";
import { bloodGroup } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type AddBloodGroupResult = { success: boolean; message?: string; error?: string };

export async function addBloodGroup(formData: FormData): Promise<AddBloodGroupResult> {
  const type = formData.get("type");
  if (!type || typeof type !== "string") {
    return { success: false, error: "Blood group type is required." };
  }

  try {
    await dbPostgres.insert(bloodGroup).values({ type });
    console.log("Added blood group:", type);
    revalidatePath("/settings/masters/blood-group");
    return { success: true, message: "Blood group added successfully." };
  } catch (error) {
    console.error("Error adding blood group:", error);
    // Provide a more generic error message or handle specific database errors
    return { success: false, error: "Failed to add blood group." };
  }
}

export async function deleteBloodGroup(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await dbPostgres.delete(bloodGroup).where(eq(bloodGroup.id, id));
    console.log("Deleted blood group with ID:", id);
    revalidatePath("/settings/masters/blood-group");
    return { success: true, message: "Blood group deleted successfully." };
  } catch (error) {
    console.error("Error deleting blood group:", error);
    return { success: false, error: "Failed to delete blood group." };
  }
}

export async function uploadBloodGroupsFromFile(formData: FormData): Promise<{ success: boolean; message?: string; error?: string }> {
  // Placeholder for upload logic
  console.log("Upload Blood Groups action triggered.", formData);
  // You would typically process the file here
  // const file = formData.get('file');
  // ... file processing and database insertion ...
  revalidatePath("/settings/masters/blood-group");
  return { success: true, message: "Upload action placeholder executed." };
}

export async function downloadBloodGroups(): Promise<{ success: boolean; message?: string; error?: string }> {
  // Placeholder for download logic
  console.log("Download Blood Groups action triggered.");
  // You would typically fetch data and generate a file for download
  // const data = await db.select().from(bloodGroup);
  // ... generate CSV/XLSX file ...
  return { success: true, message: "Download action placeholder executed." };
}
