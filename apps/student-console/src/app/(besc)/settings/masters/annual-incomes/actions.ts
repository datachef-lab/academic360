"use server";

import  {dbPostgres, db } from "@/db";
import { annualIncomes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Define the schema for adding/editing Annual Incomes
const annualIncomeSchema = z.object({
  range: z.string().min(1, "Range is required"),
});

export type AddAnnualIncomeResult = { success: boolean; message?: string; error?: string };

export async function addAnnualIncome(formData: FormData): Promise<AddAnnualIncomeResult> {
  const data = {
    range: formData.get("range"),
  };

  const validation = annualIncomeSchema.safeParse(data);

  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    await dbPostgres.insert(annualIncomes).values(validation.data);
    revalidatePath("/settings/masters/annual-incomes");
    return { success: true, message: "Annual Income range added successfully." };
  } catch (error) {
    console.error("Error adding Annual Income range:", error);
    return { success: false, error: "Failed to add Annual Income range." };
  }
}

export async function deleteAnnualIncome(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await dbPostgres.delete(annualIncomes).where(eq(annualIncomes.id, id));
    console.log("Deleted annual income with ID:", id);
    revalidatePath("/settings/masters/annual-incomes");
    return { success: true, message: "Annual Income range deleted successfully." };
  } catch (error) {
    console.error("Error deleting annual income with ID:", error);
    return { success: false, error: "Failed to delete annual income range." };
  }
}

export async function uploadAnnualIncomesFromFile(formData: FormData): Promise<{ success: boolean; message?: string; error?: string }> {
  // Placeholder for upload logic
  console.log("Upload Annual Incomes action triggered.", formData);
  revalidatePath("/settings/masters/annual-incomes");
  return { success: true, message: "Upload action placeholder executed." };
}

export async function downloadAnnualIncomes(): Promise<{ success: boolean; message?: string; error?: string }> {
  // Placeholder for download logic
  console.log("Download Annual Incomes action triggered.");
  return { success: true, message: "Download action placeholder executed." };
} 