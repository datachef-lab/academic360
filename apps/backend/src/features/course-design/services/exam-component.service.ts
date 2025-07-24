import { db } from "@/db";
import { ExamComponent, examComponentModel } from "../models/exam-component.model";
import { eq } from "drizzle-orm";
import { ExamComponentSchema } from "@/types/course-design";
import { z } from "zod";

// Types
export type ExamComponentData = z.infer<typeof ExamComponentSchema>;

// Create a new exam component
export const createExamComponent = async (examComponentData: ExamComponent) => {
  // const validatedData = ExamComponentSchema.parse(examComponentData);
  const newExamComponent = await db.insert(examComponentModel).values(examComponentData).returning();
  return newExamComponent[0];
};

// Get all exam components
export const getAllExamComponents = async () => {
  const allExamComponents = await db.select().from(examComponentModel);
  return allExamComponents;
};

// Get exam component by ID
export const getExamComponentById = async (id: string) => {
  const examComponent = await db
    .select()
    .from(examComponentModel)
    .where(eq(examComponentModel.id, +id));
  return examComponent.length > 0 ? examComponent[0] : null;
};

// Update exam component
export const updateExamComponent = async (id: string, examComponentData: ExamComponent) => {
  // const validatedData = ExamComponentSchema.parse(examComponentData);
  const updatedExamComponent = await db
    .update(examComponentModel)
    .set(examComponentData)
    .where(eq(examComponentModel.id, +id))
    .returning();
  return updatedExamComponent.length > 0 ? updatedExamComponent[0] : null;
};

// Delete exam component
export const deleteExamComponent = async (id: string) => {
  const deletedExamComponent = await db
    .delete(examComponentModel)
    .where(eq(examComponentModel.id, +id))
    .returning();
  return deletedExamComponent.length > 0 ? deletedExamComponent[0] : null;
};
