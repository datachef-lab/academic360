import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { 
  createProgramCourse, 
  getProgramCourseById, 
  getAllProgramCourses, 
  updateProgramCourse, 
  deleteProgramCourse, 
  bulkUploadProgramCourses 
} from "@/features/course-design/services/program-course.service.js";

export const createProgramCourseHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createProgramCourse(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Program course created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getProgramCourseByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const programCourse = await getProgramCourseById(id);
        if (!programCourse) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Program course with ID ${id} not found`));
        res.status(200).json(new ApiResponse(200, "SUCCESS", programCourse, "Program course fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllProgramCoursesHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const programCourses = await getAllProgramCourses();
        res.status(200).json(new ApiResponse(200, "SUCCESS", programCourses, "All program courses fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateProgramCourseHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const updated = await updateProgramCourse(id, req.body);
        if (!updated) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Program course not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Program course updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteProgramCourseHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteProgramCourse(id);
        if (!deleted) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Program course not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "DELETED", deleted, "Program course deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const bulkUploadProgramCoursesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const result = await bulkUploadProgramCourses(req.file.path);
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Bulk upload completed"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    handleError(error, res, next);
  }
};
