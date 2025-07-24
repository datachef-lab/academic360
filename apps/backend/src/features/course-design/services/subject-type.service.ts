import { db } from "@/db";
import { SubjectType, subjectTypeModel } from "../models/subject-type.model";
import { eq } from "drizzle-orm";
import { SubjectTypeSchema } from "@/types/course-design";
import { z } from "zod";

// Types
export type SubjectTypeData = z.infer<typeof SubjectTypeSchema>;

// Create a new subject type
export const createSubjectType = async (subjectTypeData: SubjectType) => {
  // const validatedData = SubjectTypeSchema.parse(subjectTypeData);
  const newSubjectType = await db.insert(subjectTypeModel).values(subjectTypeData).returning();
  return newSubjectType[0];
};

// Get all subject types
export const getAllSubjectTypes = async () => {
  const allSubjectTypes = await db.select().from(subjectTypeModel);
  return allSubjectTypes;
};

// Get subject type by ID
export const getSubjectTypeById = async (id: string) => {
  const subjectType = await db
    .select()
    .from(subjectTypeModel)
    .where(eq(subjectTypeModel.id, +id));
  return subjectType.length > 0 ? subjectType[0] : null;
};

// Update subject type
export const updateSubjectType = async (id: string, subjectTypeData: SubjectType) => {
  // const validatedData = SubjectTypeSchema.parse(subjectTypeData);
  const updatedSubjectType = await db
    .update(subjectTypeModel)
    .set(subjectTypeData)
    .where(eq(subjectTypeModel.id, +id))
    .returning();
  return updatedSubjectType.length > 0 ? updatedSubjectType[0] : null;
};

// Delete subject type
export const deleteSubjectType = async (id: string) => {
  const deletedSubjectType = await db
    .delete(subjectTypeModel)
    .where(eq(subjectTypeModel.id, +id))
    .returning();
  return deletedSubjectType.length > 0 ? deletedSubjectType[0] : null;
};
