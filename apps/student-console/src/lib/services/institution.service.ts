import { dbPostgres } from "@/db";
import { institutions } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";

export type InstitutionResult = {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
};

export async function getAllInstitutions() {
  return await dbPostgres.select().from(institutions).where(eq(institutions.disabled, false)).orderBy(institutions.name);
}

export async function getInstitutionById(id: number) {
  const result = await dbPostgres.select().from(institutions).where(eq(institutions.id, id)).limit(1);
  return result[0];
}

export async function createInstitution(name: string, degreeId: number, addressId?: number, sequence?: number): Promise<InstitutionResult> {
  try {
    const [newInstitution] = await dbPostgres.insert(institutions).values({ name, degreeId, addressId, sequence: sequence }).returning();
    return { success: true, message: "Institution created successfully.", data: newInstitution };
  } catch (error) {
    console.error("Error creating institution:", error);
    return { success: false, error: "Failed to create institution." };
  }
}

export async function updateInstitution(id: number, name: string, degreeId: number, addressId?: number, sequence?: number): Promise<InstitutionResult> {
  try {
    const [updatedInstitution] = await dbPostgres.update(institutions).set({ name, degreeId, addressId, sequence: sequence, updatedAt: new Date().toISOString() }).where(eq(institutions.id, id)).returning();

    if (!updatedInstitution) {
      return { success: false, error: "Institution not found." };
    }
    return { success: true, message: "Institution updated successfully.", data: updatedInstitution };
  } catch (error) {
    console.error("Error updating institution:", error);
    return { success: false, error: "Failed to update institution." };
  }
}

export async function toggleInstitutionStatus(id: number): Promise<InstitutionResult> {
  try {
    const currentInstitution = await getInstitutionById(id);

    if (!currentInstitution) {
      return { success: false, error: "Institution not found." };
    }

    const [updatedInstitution] = await dbPostgres.update(institutions).set({ disabled: !currentInstitution.disabled, updatedAt: new Date().toISOString() }).where(eq(institutions.id, id)).returning();

    return { success: true, message: `Institution ${updatedInstitution?.disabled ? "disabled" : "enabled"} successfully.`, data: updatedInstitution };
  } catch (error) {
    console.error("Error toggling institution status:", error);
    return { success: false, error: "Failed to toggle institution status." };
  }
} 