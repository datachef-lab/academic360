import { db } from "@/db";
import { paperComponents } from "../models/paper-component.model";
import { eq } from "drizzle-orm";
import { PaperComponentSchema } from "@/types/course-design";
import { z } from "zod";

// Types
export type PaperComponentData = z.infer<typeof PaperComponentSchema>;

// Create a new paper component
export const createPaperComponent = async (paperComponentData: PaperComponentData & { paperId: string }) => {
  const validatedData = PaperComponentSchema.parse(paperComponentData);
  const newPaperComponent = await db.insert(paperComponents).values({
    ...validatedData,
    paperId: paperComponentData.paperId,
  }).returning();
  return newPaperComponent[0];
};

// Get all paper components
export const getAllPaperComponents = async () => {
  const allPaperComponents = await db.select().from(paperComponents);
  return allPaperComponents;
};

// Get paper component by ID
export const getPaperComponentById = async (id: string) => {
  const paperComponent = await db
    .select()
    .from(paperComponents)
    .where(eq(paperComponents.id, id));
  return paperComponent.length > 0 ? paperComponent[0] : null;
};

// Update paper component
export const updatePaperComponent = async (id: string, paperComponentData: PaperComponentData & { paperId: string }) => {
  const validatedData = PaperComponentSchema.parse(paperComponentData);
  const updatedPaperComponent = await db
    .update(paperComponents)
    .set({
      ...validatedData,
      paperId: paperComponentData.paperId,
    })
    .where(eq(paperComponents.id, id))
    .returning();
  return updatedPaperComponent.length > 0 ? updatedPaperComponent[0] : null;
};

// Delete paper component
export const deletePaperComponent = async (id: string) => {
  const deletedPaperComponent = await db
    .delete(paperComponents)
    .where(eq(paperComponents.id, id))
    .returning();
  return deletedPaperComponent.length > 0 ? deletedPaperComponent[0] : null;
};
