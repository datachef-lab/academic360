import { db } from "@/db";
import { subjects } from "../models/subject.model";
import { eq } from "drizzle-orm";
import { SubjectSchema } from "@/types/course-design";
import { z } from "zod";

// Types
export type SubjectData = z.infer<typeof SubjectSchema>;

// Create a new subject
export const createSubject = async (subjectData: SubjectData) => {
  const validatedData = SubjectSchema.parse(subjectData);
  const newSubject = await db.insert(subjects).values(validatedData).returning();
  return newSubject[0];
};

// Get all subjects
export const getAllSubjects = async () => {
  const allSubjects = await db.select().from(subjects);
  return allSubjects;
};

// Get subject by ID
export const getSubjectById = async (id: string) => {
  const subject = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, id));
  return subject.length > 0 ? subject[0] : null;
};

// Update subject
export const updateSubject = async (id: string, subjectData: SubjectData) => {
  const validatedData = SubjectSchema.parse(subjectData);
  const updatedSubject = await db
    .update(subjects)
    .set(validatedData)
    .where(eq(subjects.id, id))
    .returning();
  return updatedSubject.length > 0 ? updatedSubject[0] : null;
};

// Delete subject
export const deleteSubject = async (id: string) => {
  const deletedSubject = await db
    .delete(subjects)
    .where(eq(subjects.id, id))
    .returning();
  return deletedSubject.length > 0 ? deletedSubject[0] : null;
};
