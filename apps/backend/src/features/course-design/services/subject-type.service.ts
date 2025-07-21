import { db } from "@/db";
import { subjectTypes } from "../models/subject-type.model";
import { eq } from "drizzle-orm";
import { SubjectTypeSchema } from "@/types/course-design";
import { z } from "zod";

// Types
export type SubjectTypeData = z.infer<typeof SubjectTypeSchema>;

// Create a new subject type
export const createSubjectType = async (subjectTypeData: SubjectTypeData) => {
  const validatedData = SubjectTypeSchema.parse(subjectTypeData);
  const newSubjectType = await db.insert(subjectTypes).values(validatedData).returning();
  return newSubjectType[0];
};

// Get all subject types
export const getAllSubjectTypes = async () => {
  const allSubjectTypes = await db.select().from(subjectTypes);
  return allSubjectTypes;
};

// Get subject type by ID
export const getSubjectTypeById = async (id: string) => {
  const subjectType = await db
    .select()
    .from(subjectTypes)
    .where(eq(subjectTypes.id, id));
  return subjectType.length > 0 ? subjectType[0] : null;
};

// Update subject type
export const updateSubjectType = async (id: string, subjectTypeData: SubjectTypeData) => {
  const validatedData = SubjectTypeSchema.parse(subjectTypeData);
  const updatedSubjectType = await db
    .update(subjectTypes)
    .set(validatedData)
    .where(eq(subjectTypes.id, id))
    .returning();
  return updatedSubjectType.length > 0 ? updatedSubjectType[0] : null;
};

// Delete subject type
export const deleteSubjectType = async (id: string) => {
  const deletedSubjectType = await db
    .delete(subjectTypes)
    .where(eq(subjectTypes.id, id))
    .returning();
  return deletedSubjectType.length > 0 ? deletedSubjectType[0] : null;
};
