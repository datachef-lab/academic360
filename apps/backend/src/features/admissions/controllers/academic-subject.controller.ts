import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createSubject,
  getSubjectById,
  getAllSubjects,
  updateSubject,
  toggleSubjectStatus
} from "../services/academic-subject.service.js";

export const createAcademicSubjectHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createSubject(req.body);
    res.status(201).json(new ApiResponse(201, "SUCCESS", result, "Academic subject created successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAcademicSubjectByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getSubjectById(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Academic subject with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Academic subject fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllAcademicSubjectsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getAllSubjects();
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Academic subjects fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAcademicSubjectHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await updateSubject(Number(req.params.id), req.body);
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Academic subject with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", result, `Academic subject with ID ${req.params.id} updated successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAcademicSubjectHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await toggleSubjectStatus(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Academic subject with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", result, `Academic subject with ID ${req.params.id} status toggled successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
}; 