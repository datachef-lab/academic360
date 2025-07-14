import { Request, Response } from "express";
import { db } from "@/db";
import { courses } from "../models/course.model";
import { eq } from "drizzle-orm";
import { CourseSchema } from "@/types/course-design";

export const createCourse = async (req: Request, res: Response) => {
  try {
    const courseData = CourseSchema.parse(req.body);
    const newCourse = await db.insert(courses).values(courseData).returning();
    res.status(201).json(newCourse[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllCourses = async (_req: Request, res: Response) => {
  try {
    const allCourses = await db.select().from(courses);
    res.json(allCourses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await db.select().from(courses).where(eq(courses.id, req.params.id));
    if (!course.length) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const courseData = CourseSchema.parse(req.body);
    const updatedCourse = await db
      .update(courses)
      .set(courseData)
      .where(eq(courses.id, req.params.id))
      .returning();
    if (!updatedCourse.length) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(updatedCourse[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const deletedCourse = await db
      .delete(courses)
      .where(eq(courses.id, req.params.id))
      .returning();
    if (!deletedCourse.length) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
