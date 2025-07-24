import { db } from "@/db";
import { RegulationType, regulationTypeModel } from "../models/regulation-type.model";
import { eq } from "drizzle-orm";
// import { insertRegulationTypeSchema } from "../models/regulation-type.model";
import { z } from "zod";

// Types
// export type RegulationTypeData = z.infer<typeof insertRegulationTypeSchema>;

// Create a new regulationType
export const createRegulationType = async (regulationTypeData: RegulationType) => {
  // const validatedData = insertRegulationTypeSchema.parse(regulationTypeData);
  const newRegulationType = await db.insert(regulationTypeModel).values(regulationTypeData).returning();
  return newRegulationType[0];
};

// Get all regulationTypes
export const getAllRegulationTypes = async () => {
  const allRegulationTypes = await db.select().from(regulationTypeModel);
  return allRegulationTypes;
};

// Get regulationType by ID
export const getRegulationTypeById = async (id: string) => {
  const regulationType = await db.select().from(regulationTypeModel).where(eq(regulationTypeModel.id, +id));
  return regulationType.length > 0 ? regulationType[0] : null;
};

// Update regulationType
export const updateRegulationType = async (id: string, regulationTypeData: RegulationType) => {
  // const validatedData = insertRegulationTypeSchema.parse(regulationTypeData);
  const updatedRegulationType = await db
    .update(regulationTypeModel)
    .set(regulationTypeData)
    .where(eq(regulationTypeModel.id, +id))
    .returning();
  return updatedRegulationType.length > 0 ? updatedRegulationType[0] : null;
};

// Delete regulationType
export const deleteRegulationType = async (id: string) => {
  const deletedRegulationType = await db
    .delete(regulationTypeModel)
    .where(eq(regulationTypeModel.id, +id))
    .returning();
  return deletedRegulationType.length > 0 ? deletedRegulationType[0] : null;
};
