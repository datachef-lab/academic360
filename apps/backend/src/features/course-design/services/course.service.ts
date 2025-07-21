import { db } from "@/db";
import { courses } from "../models/course.model";
import { eq } from "drizzle-orm";
import { CourseSchema } from "@/types/course-design";
import { z } from "zod";

// Types
export type CourseData = z.infer<typeof CourseSchema>;

// Create a new course
export const createCourse = async (courseData: CourseData) => {
  const validatedData = CourseSchema.parse(courseData);
  const newCourse = await db.insert(courses).values(validatedData).returning();
  return newCourse[0];
};

// Get all courses
export const getAllCourses = async () => {
  const allCourses = await db.select().from(courses);
  return allCourses;
};

// Get course by ID
export const getCourseById = async (id: string) => {
  const course = await db.select().from(courses).where(eq(courses.id, id));
  return course.length > 0 ? course[0] : null;
};

// Update course
export const updateCourse = async (id: string, courseData: CourseData) => {
  const validatedData = CourseSchema.parse(courseData);
  const updatedCourse = await db
    .update(courses)
    .set(validatedData)
    .where(eq(courses.id, id))
    .returning();
  return updatedCourse.length > 0 ? updatedCourse[0] : null;
};

// Delete course
export const deleteCourse = async (id: string) => {
  const deletedCourse = await db
    .delete(courses)
    .where(eq(courses.id, id))
    .returning();
  return deletedCourse.length > 0 ? deletedCourse[0] : null;
};
