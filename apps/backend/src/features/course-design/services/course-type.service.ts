import { db } from "@/db";
import { courseTypes } from "../models/course-type.model";
import { eq } from "drizzle-orm";
import { insertCourseTypeSchema } from "../models/course-type.model";
import { z } from "zod";

// Types
export type CourseTypeData = z.infer<typeof insertCourseTypeSchema>;

// Create a new courseType
export const createCourseType = async (courseTypeData: CourseTypeData) => {
  const validatedData = insertCourseTypeSchema.parse(courseTypeData);
  const newCourseType = await db.insert(courseTypes).values(validatedData).returning();
  return newCourseType[0];
};

// Get all courseTypes
export const getAllCourseTypes = async () => {
  const allCourseTypes = await db.select().from(courseTypes);
  return allCourseTypes;
};

// Get courseType by ID
export const getCourseTypeById = async (id: string) => {
  const courseType = await db.select().from(courseTypes).where(eq(courseTypes.id, id));
  return courseType.length > 0 ? courseType[0] : null;
};

// Update courseType
export const updateCourseType = async (id: string, courseTypeData: CourseTypeData) => {
  const validatedData = insertCourseTypeSchema.parse(courseTypeData);
  const updatedCourseType = await db
    .update(courseTypes)
    .set(validatedData)
    .where(eq(courseTypes.id, id))
    .returning();
  return updatedCourseType.length > 0 ? updatedCourseType[0] : null;
};

// Delete courseType
export const deleteCourseType = async (id: string) => {
  const deletedCourseType = await db
    .delete(courseTypes)
    .where(eq(courseTypes.id, id))
    .returning();
  return deletedCourseType.length > 0 ? deletedCourseType[0] : null;
};
