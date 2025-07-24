import { Request, Response } from "express";
import {
  createCourseLevel as createCourseLevelService,
  getAllCourseLevels as getAllCourseLevelsService,
  getCourseLevelById as getCourseLevelByIdService,
  updateCourseLevel as updateCourseLevelService,
  deleteCourseLevel as deleteCourseLevelService,
} from "../services/course-level.service";

export const createCourseLevel = async (req: Request, res: Response) => {
  try {
    const newCourseLevel = await createCourseLevelService(req.body);
    res.status(201).json(newCourseLevel);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllCourseLevels = async (_req: Request, res: Response) => {
  try {
    const allCourseLevels = await getAllCourseLevelsService();
    res.json(allCourseLevels);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseLevelById = async (req: Request, res: Response) => {
  try {
    const courseLevel = await getCourseLevelByIdService(req.params.id);
    if (!courseLevel) {
      return res.status(404).json({ error: "CourseLevel not found" });
    }
    res.json(courseLevel);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCourseLevel = async (req: Request, res: Response) => {
  try {
    const updatedCourseLevel = await updateCourseLevelService(req.params.id, req.body);
    if (!updatedCourseLevel) {
      return res.status(404).json({ error: "CourseLevel not found" });
    }
    res.json(updatedCourseLevel);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCourseLevel = async (req: Request, res: Response) => {
  try {
    const deletedCourseLevel = await deleteCourseLevelService(req.params.id);
    if (!deletedCourseLevel) {
      return res.status(404).json({ error: "CourseLevel not found" });
    }
    res.json({ message: "CourseLevel deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
