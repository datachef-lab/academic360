import { db } from "@/db";
import { CourseLevel, courseLevelModel } from "../models/course-level.model";
import { eq } from "drizzle-orm";
// import { insertCourseLevelSchema } from "../models/course-level.model";
import { z } from "zod";

// Types
// export type CourseLevelData = z.infer<typeof insertCourseLevelSchema>;

// Create a new courseLevel
export const createCourseLevel = async (courseLevelData: CourseLevel) => {
  // const validatedData = insertCourseLevelSchema.parse(courseLevelData);
  const newCourseLevel = await db.insert(courseLevelModel).values(courseLevelData).returning();
  return newCourseLevel[0];
};

// Get all courseLevels
export const getAllCourseLevels = async () => {
  const allCourseLevels = await db.select().from(courseLevelModel);
  return allCourseLevels;
};

// Get courseLevel by ID
export const getCourseLevelById = async (id: string) => {
  const courseLevel = await db.select().from(courseLevelModel).where(eq(courseLevelModel.id, +id));
  return courseLevel.length > 0 ? courseLevel[0] : null;
};

// Update courseLevel
export const updateCourseLevel = async (id: string, courseLevelData: CourseLevel) => {
  // const validatedData = insertCourseLevelSchema.parse(courseLevelData);
  const updatedCourseLevel = await db
    .update(courseLevelModel)
    .set(courseLevelData)
    .where(eq(courseLevelModel.id, +id))
    .returning();
  return updatedCourseLevel.length > 0 ? updatedCourseLevel[0] : null;
};

// Delete courseLevel
export const deleteCourseLevel = async (id: string) => {
  const deletedCourseLevel = await db
      .delete(courseLevelModel)
    .where(eq(courseLevelModel.id, +id))
    .returning();
  return deletedCourseLevel.length > 0 ? deletedCourseLevel[0] : null;
};
