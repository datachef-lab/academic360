import { db } from "@/db";
import { PaperComponent, paperComponentModel } from "../models/paper-component.model";
import { and, eq } from "drizzle-orm";
import { PaperComponentDto } from "@/types/course-design/index.type";

// Create a new paper component
export const createPaperComponent = async (paperComponentData: PaperComponentDto) => {
  const { id, createdAt, updatedAt, examComponent, ...props } = paperComponentData;
  let [existingPaperComponent] = await db
  .select().from(paperComponentModel)
  .where(
    and(
      eq(paperComponentModel.examComponentId, examComponent?.id!),
      eq(paperComponentModel.paperId, paperComponentData.paperId!)
    )
  );  
  if (!existingPaperComponent) {
    const [newPaperComponent] = await db.insert(paperComponentModel).values({...props, examComponentId: examComponent?.id!}).returning();
    existingPaperComponent = newPaperComponent;
  }
  return existingPaperComponent;
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
export const updatePaperComponent = async (id: string, paperComponentData: PaperComponentDto) => {
  const { id: idObj, createdAt, updatedAt, examComponent, ...props } = paperComponentData;
  const updatedPaperComponent = await db
    .update(paperComponentModel)
    .set({...props, examComponentId: examComponent?.id!})
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
