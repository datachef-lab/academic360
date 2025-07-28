import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { createAcademicHistorySchema } from "../models/academicHistory.model.js";
import { AcademicHistoryType } from "@/types/user/academic-history.js";
import {
  addAcademicHistory,
  findAcademicHistoryById,
  findAcademicHistoryByStudentId,
  findAllAcademicHistory,
  removeAcademicHistory,
  saveAcademicHistory
} from "@/features/user/services/academicHistory.service.js";

export const createAcademicHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createAcademicHistorySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(new ApiResponse(400, "VALIDATION_ERROR", null, JSON.stringify(parseResult.error.flatten())));
      return;
    }
    const newAcademicHistory = await addAcademicHistory(req.body as AcademicHistoryType);
    res.status(201).json(new ApiResponse(201, "SUCCESS", newAcademicHistory, "New academicHistory is added to db!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAcademicHistoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const foundAcademicHistory = await findAcademicHistoryById(id);
    if (!foundAcademicHistory) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicHistory of ID ${id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", foundAcademicHistory, "Fetched academicHistory successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAcademicHistoryByStudentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = Number(req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid student ID format"));
      return;
    }
    const foundAcademicHistory = await findAcademicHistoryByStudentId(studentId);
    if (!foundAcademicHistory) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicHistory of studentId ${studentId} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", foundAcademicHistory, "Fetched academicHistory successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllAcademicHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const academicHistories = await findAllAcademicHistory(page, pageSize);
    res.status(200).json(new ApiResponse(200, "SUCCESS", academicHistories, "Fetched all academicHistory!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAcademicHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const parseResult = createAcademicHistorySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(new ApiResponse(400, "VALIDATION_ERROR", null, JSON.stringify(parseResult.error.flatten())));
      return;
    }
    const updatedAcademicHistory = await saveAcademicHistory(id, req.body as AcademicHistoryType);
    if (!updatedAcademicHistory) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "academicHistory not found"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", updatedAcademicHistory, `academicHistory of ID ${id} updated successfully`));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAcademicHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const deletedAcademicHistory = await removeAcademicHistory(id);
    if (!deletedAcademicHistory) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "academicHistory not found"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", deletedAcademicHistory, `academicHistory of ID ${id} deleted successfully`));
  } catch (error) {
    handleError(error, res, next);
  }
};
