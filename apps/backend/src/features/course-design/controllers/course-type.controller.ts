import { Request, Response } from "express";
import {
  createCourseType as createCourseTypeService,
  getAllCourseTypes as getAllCourseTypesService,
  getCourseTypeById as getCourseTypeByIdService,
  updateCourseType as updateCourseTypeService,
  deleteCourseType as deleteCourseTypeService,
} from "../services/course-type.service";

export const createCourseType = async (req: Request, res: Response) => {
  try {
    const newCourseType = await createCourseTypeService(req.body);
    res.status(201).json(newCourseType);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllCourseTypes = async (_req: Request, res: Response) => {
  try {
    const allCourseTypes = await getAllCourseTypesService();
    res.json(allCourseTypes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseTypeById = async (req: Request, res: Response) => {
  try {
    const courseType = await getCourseTypeByIdService(req.params.id);
    if (!courseType) {
      return res.status(404).json({ error: "CourseType not found" });
    }
    res.json(courseType);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCourseType = async (req: Request, res: Response) => {
  try {
    const updatedCourseType = await updateCourseTypeService(req.params.id, req.body);
    if (!updatedCourseType) {
      return res.status(404).json({ error: "CourseType not found" });
    }
    res.json(updatedCourseType);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCourseType = async (req: Request, res: Response) => {
  try {
    const deletedCourseType = await deleteCourseTypeService(req.params.id);
    if (!deletedCourseType) {
      return res.status(404).json({ error: "CourseType not found" });
    }
    res.json({ message: "CourseType deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
