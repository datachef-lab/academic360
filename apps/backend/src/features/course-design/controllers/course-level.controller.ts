import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createCourseLevel as createCourseLevelService,
  getAllCourseLevels as getAllCourseLevelsService,
  getCourseLevelById as getCourseLevelByIdService,
  updateCourseLevel as updateCourseLevelService,
  deleteCourseLevel as deleteCourseLevelService,
  bulkUploadCourseLevels as bulkUploadCourseLevelsService,
} from "../services/course-level.service";

export const createCourseLevel = async (req: Request, res: Response) => {
  try {
    const newCourseLevel = await createCourseLevelService(req.body);
    res.status(201).json(new ApiResponse(201, "SUCCESS", newCourseLevel, "Course level created successfully!"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, errorMessage));
  }
};

export const bulkUploadCourseLevels = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json(new ApiResponse(400, "ERROR", null, "No file uploaded"));
    }

    const result = await bulkUploadCourseLevelsService(req.file.path);
    
    const response = {
      success: result.success,
      errors: result.errors,
      summary: {
        total: result.success.length + result.errors.length,
        successful: result.success.length,
        failed: result.errors.length
      }
    };

    res.status(200).json(new ApiResponse(200, "SUCCESS", response, "Bulk upload completed"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, errorMessage));
  }
};

export const getAllCourseLevels = async (_req: Request, res: Response) => {
  try {
    const allCourseLevels = await getAllCourseLevelsService();
    res.status(200).json(new ApiResponse(200, "SUCCESS", allCourseLevels, "All course levels fetched"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, errorMessage));
  }
};

export const getCourseLevelById = async (req: Request, res: Response) => {
  try {
    const courseLevel = await getCourseLevelByIdService(req.params.id);
    if (!courseLevel) {
      return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course level not found"));
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", courseLevel, "Course level fetched successfully"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, errorMessage));
  }
};

export const updateCourseLevel = async (req: Request, res: Response) => {
  try {
    const updatedCourseLevel = await updateCourseLevelService(req.params.id, req.body);
    if (!updatedCourseLevel) {
      return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course level not found"));
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", updatedCourseLevel, "Course level updated successfully"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, errorMessage));
  }
};

export const deleteCourseLevel = async (req: Request, res: Response) => {
  try {
    const deletedCourseLevel = await deleteCourseLevelService(req.params.id);
    if (!deletedCourseLevel) {
      return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course level not found"));
    }
    res.status(200).json(new ApiResponse(200, "DELETED", deletedCourseLevel, "Course level deleted successfully"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, errorMessage));
  }
};
