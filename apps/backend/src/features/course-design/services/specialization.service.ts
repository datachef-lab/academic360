import { db } from "@/db/index.js";
import {
  Specialization,
  specializationModel,
} from "@repo/db/schemas/models/course-design";
import { countDistinct, eq } from "drizzle-orm";
import { SpecializationSchema } from "@/types/course-design/index.js";
import { z } from "zod";
import { studentModel } from "@repo/db/schemas/models/user";

// Types
export type SpecializationData = z.infer<typeof SpecializationSchema>;

// Create a new specialization
export const createSpecialization = async (
  specializationData: Specialization,
) => {
  // const validatedData = SpecializationSchema.parse(specializationData);
  const newSpecialization = await db
    .insert(specializationModel)
    .values(specializationData)
    .returning();
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
export const updateSpecialization = async (
  id: string,
  specializationData: Specialization,
) => {
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

export const deleteSpecializationSafe = async (id: string) => {
  const [found] = await db
    .select()
    .from(specializationModel)
    .where(eq(specializationModel.id, +id));
  if (!found) return null;

  const [{ studentCount }] = await db
    .select({ studentCount: countDistinct(studentModel.id) })
    .from(studentModel)
    .where(eq(studentModel.specializationId, +id));

  if (studentCount > 0) {
    return {
      success: false,
      message:
        "Cannot delete specialization. It is associated with other records.",
      records: [{ count: studentCount, type: "Student" }],
    };
  }

  const deletedSpecialization = await db
    .delete(specializationModel)
    .where(eq(specializationModel.id, +id))
    .returning();
  if (deletedSpecialization.length > 0) {
    return {
      success: true,
      message: "Specialization deleted successfully.",
      records: [],
    };
  }
  return {
    success: false,
    message: "Failed to delete specialization.",
    records: [],
  };
};
