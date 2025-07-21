import { Request, Response } from "express";
import {
  createCourse as createCourseService,
  getAllCourses as getAllCoursesService,
  getCourseById as getCourseByIdService,
  updateCourse as updateCourseService,
  deleteCourse as deleteCourseService,
} from "../services/course.service";

export const createCourse = async (req: Request, res: Response) => {
  try {
    const newCourse = await createCourseService(req.body);
    res.status(201).json(newCourse);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllCourses = async (_req: Request, res: Response) => {
  try {
    const allCourses = await getAllCoursesService();
    res.json(allCourses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await getCourseByIdService(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const updatedCourse = await updateCourseService(req.params.id, req.body);
    if (!updatedCourse) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(updatedCourse);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const deletedCourse = await deleteCourseService(req.params.id);
    if (!deletedCourse) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
