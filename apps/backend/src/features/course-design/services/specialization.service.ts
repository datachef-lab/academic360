import { db } from "@/db";
import { Specialization, specializationModel } from "../models/specialization.model.js";
import { eq } from "drizzle-orm";
import { SpecializationSchema } from "@/types/course-design/index.js";
import { z } from "zod";

// Types
export type SpecializationData = z.infer<typeof SpecializationSchema>;

// Create a new specialization
export const createSpecialization = async (specializationData: Specialization) => {
  // const validatedData = SpecializationSchema.parse(specializationData);
  const newSpecialization = await db.insert(specializationModel).values(specializationData).returning();
  return newSpecialization[0];
};

// Get all specializations
export const getAllSpecializations = async () => {
  const allSpecializations = await db.select().from(specializationModel);
  return allSpecializations;
};

// Get specialization by ID
export const getSpecializationById = async (id: string) => {
  const specialization = await db
    .select()
    .from(specializationModel)
    .where(eq(specializationModel.id, +id));
  return specialization.length > 0 ? specialization[0] : null;
};

// Update specialization
export const updateSpecialization = async (id: string, specializationData: Specialization) => {
  // const validatedData = SpecializationSchema.parse(specializationData);
  const updatedSpecialization = await db
    .update(specializationModel)
    .set(specializationData)
    .where(eq(specializationModel.id, +id))
    .returning();
  return updatedSpecialization.length > 0 ? updatedSpecialization[0] : null;
};

// Delete specialization
export const deleteSpecialization = async (id: string) => {
  const deletedSpecialization = await db
      .delete(specializationModel)
    .where(eq(specializationModel.id, +id))
    .returning();
  return deletedSpecialization.length > 0 ? deletedSpecialization[0] : null;
};
