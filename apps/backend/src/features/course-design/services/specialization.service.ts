import { db } from "@/db";
import { specializations } from "../models/specialization.model";
import { eq } from "drizzle-orm";
import { SpecializationSchema } from "@/types/course-design";
import { z } from "zod";

// Types
export type SpecializationData = z.infer<typeof SpecializationSchema>;

// Create a new specialization
export const createSpecialization = async (specializationData: SpecializationData) => {
  const validatedData = SpecializationSchema.parse(specializationData);
  const newSpecialization = await db.insert(specializations).values(validatedData).returning();
  return newSpecialization[0];
};

// Get all specializations
export const getAllSpecializations = async () => {
  const allSpecializations = await db.select().from(specializations);
  return allSpecializations;
};

// Get specialization by ID
export const getSpecializationById = async (id: string) => {
  const specialization = await db
    .select()
    .from(specializations)
    .where(eq(specializations.id, id));
  return specialization.length > 0 ? specialization[0] : null;
};

// Update specialization
export const updateSpecialization = async (id: string, specializationData: SpecializationData) => {
  const validatedData = SpecializationSchema.parse(specializationData);
  const updatedSpecialization = await db
    .update(specializations)
    .set(validatedData)
    .where(eq(specializations.id, id))
    .returning();
  return updatedSpecialization.length > 0 ? updatedSpecialization[0] : null;
};

// Delete specialization
export const deleteSpecialization = async (id: string) => {
  const deletedSpecialization = await db
    .delete(specializations)
    .where(eq(specializations.id, id))
    .returning();
  return deletedSpecialization.length > 0 ? deletedSpecialization[0] : null;
};
