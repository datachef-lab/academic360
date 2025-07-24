import { Request, Response } from "express";
import {
  createProgramCourse as createProgramCourseService,
  getAllProgramCourses as getAllProgramCoursesService,
  getProgramCourseById as getProgramCourseByIdService,
  updateProgramCourse as updateProgramCourseService,
  deleteProgramCourse as deleteProgramCourseService,
} from "../services/program-course.service";

export const createProgramCourse = async (req: Request, res: Response) => {
  try {
    const newProgramCourse = await createProgramCourseService(req.body);
    res.status(201).json(newProgramCourse);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllProgramCourses = async (_req: Request, res: Response) => {
  try {
    const allProgramCourses = await getAllProgramCoursesService();
    res.json(allProgramCourses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProgramCourseById = async (req: Request, res: Response) => {
  try {
    const programCourse = await getProgramCourseByIdService(req.params.id);
    if (!programCourse) {
      return res.status(404).json({ error: "ProgramCourse not found" });
    }
    res.json(programCourse);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProgramCourse = async (req: Request, res: Response) => {
  try {
    const updatedProgramCourse = await updateProgramCourseService(req.params.id, req.body);
    if (!updatedProgramCourse) {
      return res.status(404).json({ error: "ProgramCourse not found" });
    }
    res.json(updatedProgramCourse);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteProgramCourse = async (req: Request, res: Response) => {
  try {
    const deletedProgramCourse = await deleteProgramCourseService(req.params.id);
    if (!deletedProgramCourse) {
      return res.status(404).json({ error: "ProgramCourse not found" });
    }
    res.json({ message: "ProgramCourse deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
