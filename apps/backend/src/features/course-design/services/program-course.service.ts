import { db } from "@/db";
import { programCourses } from "../models/program-course.model";
import { eq } from "drizzle-orm";
import { insertProgramCourseSchema } from "../models/program-course.model";
import { z } from "zod";

// Types
export type ProgramCourseData = z.infer<typeof insertProgramCourseSchema>;

// Create a new programCourse
export const createProgramCourse = async (programCourseData: ProgramCourseData) => {
  const validatedData = insertProgramCourseSchema.parse(programCourseData);
  const newProgramCourse = await db.insert(programCourses).values(validatedData).returning();
  return newProgramCourse[0];
};

// Get all programCourses
export const getAllProgramCourses = async () => {
  const allProgramCourses = await db.select().from(programCourses);
  return allProgramCourses;
};

// Get programCourse by ID
export const getProgramCourseById = async (id: string) => {
  const programCourse = await db.select().from(programCourses).where(eq(programCourses.id, +id));
  return programCourse.length > 0 ? programCourse[0] : null;
};

// Update programCourse
export const updateProgramCourse = async (id: string, programCourseData: ProgramCourseData) => {
  const validatedData = insertProgramCourseSchema.parse(programCourseData);
  const updatedProgramCourse = await db
    .update(programCourses)
    .set(validatedData)
    .where(eq(programCourses.id, +id))
    .returning();
  return updatedProgramCourse.length > 0 ? updatedProgramCourse[0] : null;
};

// Delete programCourse
export const deleteProgramCourse = async (id: string) => {
  const deletedProgramCourse = await db
    .delete(programCourses)
    .where(eq(programCourses.id, +id))
    .returning();
  return deletedProgramCourse.length > 0 ? deletedProgramCourse[0] : null;
};
