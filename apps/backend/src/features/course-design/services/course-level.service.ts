import { db } from "@/db";
import { courseLevels } from "../models/course-level.model";
import { eq } from "drizzle-orm";
import { insertCourseLevelSchema } from "../models/course-level.model";
import { z } from "zod";

// Types
export type CourseLevelData = z.infer<typeof insertCourseLevelSchema>;

// Create a new courseLevel
export const createCourseLevel = async (courseLevelData: CourseLevelData) => {
  const validatedData = insertCourseLevelSchema.parse(courseLevelData);
  const newCourseLevel = await db.insert(courseLevels).values(validatedData).returning();
  return newCourseLevel[0];
};

// Get all courseLevels
export const getAllCourseLevels = async () => {
  const allCourseLevels = await db.select().from(courseLevels);
  return allCourseLevels;
};

// Get courseLevel by ID
export const getCourseLevelById = async (id: string) => {
  const courseLevel = await db.select().from(courseLevels).where(eq(courseLevels.id, id));
  return courseLevel.length > 0 ? courseLevel[0] : null;
};

// Update courseLevel
export const updateCourseLevel = async (id: string, courseLevelData: CourseLevelData) => {
  const validatedData = insertCourseLevelSchema.parse(courseLevelData);
  const updatedCourseLevel = await db
    .update(courseLevels)
    .set(validatedData)
    .where(eq(courseLevels.id, id))
    .returning();
  return updatedCourseLevel.length > 0 ? updatedCourseLevel[0] : null;
};

// Delete courseLevel
export const deleteCourseLevel = async (id: string) => {
  const deletedCourseLevel = await db
    .delete(courseLevels)
    .where(eq(courseLevels.id, id))
    .returning();
  return deletedCourseLevel.length > 0 ? deletedCourseLevel[0] : null;
};
