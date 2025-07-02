import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAdmissionCourse,
  findAdmissionCourseById,
  findAdmissionCoursesByAdmissionId,
  updateAdmissionCourse,
  deleteAdmissionCourse
} from "../services/admission-course.service.js";

export const createAdmissionCourseHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createAdmissionCourse(req.body);
    res.status(201).json(new ApiResponse(201, "SUCCESS", result, "Admission course created successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionCourseByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findAdmissionCourseById(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Admission course with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Admission course fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionCoursesByAdmissionIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findAdmissionCoursesByAdmissionId(Number(req.params.admissionId));
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Admission courses fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAdmissionCourseHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await updateAdmissionCourse({ ...req.body, id: Number(req.params.id) });
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Admission course with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", result, `Admission course with ID ${req.params.id} updated successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAdmissionCourseHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteAdmissionCourse(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Admission course with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", { success: result }, `Admission course with ID ${req.params.id} deleted successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
}; 