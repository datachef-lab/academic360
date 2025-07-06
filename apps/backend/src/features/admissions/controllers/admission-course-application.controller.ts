import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAdmissionCourse,
  findAdmissionCourseById,
  findAdmissionCoursesByApplicationFormId,
  updateAdmissionCourse,
  deleteAdmissionCourse
} from "../services/admission-course-application.service.js";

export const createAdmissionCourseApplicationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createAdmissionCourse(req.body);
    res.status(201).json(new ApiResponse(201, "SUCCESS", result, "Admission course application created successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionCourseApplicationByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findAdmissionCourseById(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Admission course application with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Admission course application fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionCourseApplicationsByApplicationFormIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findAdmissionCoursesByApplicationFormId(Number(req.params.applicationFormId));
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Admission course applications fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAdmissionCourseApplicationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await updateAdmissionCourse({ ...req.body, id: Number(req.params.id) });
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Admission course application with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", result, `Admission course application with ID ${req.params.id} updated successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAdmissionCourseApplicationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteAdmissionCourse(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Admission course application with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", { success: result }, `Admission course application with ID ${req.params.id} deleted successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
}; 