import { db } from "@/db";
import { affiliationTypes } from "../models/affiliation-type.model";
import { eq } from "drizzle-orm";
import { insertAffiliationTypeSchema } from "../models/affiliation-type.model";
import { z } from "zod";

// Types
export type AffiliationTypeData = z.infer<typeof insertAffiliationTypeSchema>;

// Create a new affiliationType
export const createAffiliationType = async (affiliationTypeData: AffiliationTypeData) => {
  const validatedData = insertAffiliationTypeSchema.parse(affiliationTypeData);
  const newAffiliationType = await db.insert(affiliationTypes).values(validatedData).returning();
  return newAffiliationType[0];
};

// Get all affiliationTypes
export const getAllAffiliationTypes = async () => {
  const allAffiliationTypes = await db.select().from(affiliationTypes);
  return allAffiliationTypes;
};

// Get affiliationType by ID
export const getAffiliationTypeById = async (id: string) => {
  const affiliationType = await db.select().from(affiliationTypes).where(eq(affiliationTypes.id, id));
  return affiliationType.length > 0 ? affiliationType[0] : null;
};

// Update affiliationType
export const updateAffiliationType = async (id: string, affiliationTypeData: AffiliationTypeData) => {
  const validatedData = insertAffiliationTypeSchema.parse(affiliationTypeData);
  const updatedAffiliationType = await db
    .update(affiliationTypes)
    .set(validatedData)
    .where(eq(affiliationTypes.id, id))
    .returning();
  return updatedAffiliationType.length > 0 ? updatedAffiliationType[0] : null;
};

// Delete affiliationType
export const deleteAffiliationType = async (id: string) => {
  const deletedAffiliationType = await db
    .delete(affiliationTypes)
    .where(eq(affiliationTypes.id, id))
    .returning();
  return deletedAffiliationType.length > 0 ? deletedAffiliationType[0] : null;
};
