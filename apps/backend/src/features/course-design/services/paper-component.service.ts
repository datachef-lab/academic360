import { db } from "@/db";
import { PaperComponent, paperComponentModel } from "../models/paper-component.model";
import { eq } from "drizzle-orm";
import { PaperComponentSchema } from "@/types/course-design";
import { z } from "zod";

// Types
export type PaperComponentData = z.infer<typeof PaperComponentSchema>;

// Create a new paper component
export const createPaperComponent = async (paperComponentData: PaperComponent) => {
  // const validatedData = PaperComponentSchema.parse(paperComponentData);
  const newPaperComponent = await db.insert(paperComponentModel).values(paperComponentData).returning();
  return newPaperComponent[0];
};

// Get all paper components
export const getAllPaperComponents = async () => {
  const allPaperComponents = await db.select().from(paperComponentModel);
  return allPaperComponents;
};

// Get paper component by ID
export const getPaperComponentById = async (id: string) => {
  const paperComponent = await db
    .select()
    .from(paperComponentModel)
    .where(eq(paperComponentModel.id, +id));
  return paperComponent.length > 0 ? paperComponent[0] : null;
};

// Update paper component
export const updatePaperComponent = async (id: string, paperComponentData: PaperComponent) => {
  // const validatedData = PaperComponentSchema.parse(paperComponentData);
  const updatedPaperComponent = await db
    .update(paperComponentModel)
    .set({
      ...paperComponentData,
    })
    .where(eq(paperComponentModel.id, +id))
    .returning();
  return updatedPaperComponent.length > 0 ? updatedPaperComponent[0] : null;
};

// Delete paper component
export const deletePaperComponent = async (id: string) => {
  const deletedPaperComponent = await db
    .delete(paperComponentModel)
    .where(eq(paperComponentModel.id, +id))
    .returning();
  return deletedPaperComponent.length > 0 ? deletedPaperComponent[0] : null;
};
