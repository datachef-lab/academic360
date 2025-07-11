import { ApiResponse } from "@/utils/ApiResonse.js";
import { NextFunction, Response, Request } from "express";
import { createAcademicIdentifierSchema } from "@/features/user/models/academicIdentifier.model.js";
import {
  addAcademicIdentifier,
  findAcademicIdentifierById,
  findAcademicIdentifierByStudentId,
  saveAcademicIdentifier,
  removeAcademicIdentifier,
  removeAcademicIdentifierByStudentId,
  getAllAcademicIdentifiers
} from "../services/academicIdentifier.service.js";
import { AcademicIdentifierType } from "@/types/user/academic-identifier.js";
import { handleError } from "@/utils/handleError.js";

export const createAcademicIdentifier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createAcademicIdentifierSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(new ApiResponse(400, "VALIDATION_ERROR", null, JSON.stringify(parseResult.error.flatten())));
      return;
    }
    const newAcademicIdentifier = await addAcademicIdentifier(req.body as AcademicIdentifierType);
    res.status(201).json(new ApiResponse(201, "SUCCESS", newAcademicIdentifier, "New academicIdentifier is added to db!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAcademicIdentifierById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const foundAcademicIdentifier = await findAcademicIdentifierById(id);
    if (!foundAcademicIdentifier) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicIdentifier of ID ${id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", foundAcademicIdentifier, "Fetched academicIdentifier successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAcademicIdentifierByStudentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = Number(req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid student ID format"));
      return;
    }
    const foundAcademicIdentifier = await findAcademicIdentifierByStudentId(studentId);
    if (!foundAcademicIdentifier) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicIdentifier of studentId ${studentId} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", foundAcademicIdentifier, "Fetched academicIdentifier successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAcademicIdentifier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.body) {
    res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Fields content can not be empty"));
    return;
  }
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const parseResult = createAcademicIdentifierSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(new ApiResponse(400, "VALIDATION_ERROR", null, JSON.stringify(parseResult.error.flatten())));
      return;
    }
    const updatedAcademicIdentifier = await saveAcademicIdentifier(id, req.body as AcademicIdentifierType);
    if (!updatedAcademicIdentifier) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "academicIdentifier not found"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", updatedAcademicIdentifier, "AcademicIdentifier updated successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAcademicIdentifier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const isDeleted = await removeAcademicIdentifier(id);
    if (isDeleted === null) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicIdentifier with ID ${id} not found`));
      return;
    }
    if (!isDeleted) {
      res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete academicIdentifier"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", null, "academicIdentifier deleted successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAcademicIdentifierByStudentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = Number(req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid student ID format"));
      return;
    }
    const isDeleted = await removeAcademicIdentifierByStudentId(studentId);
    if (isDeleted === null) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicIdentifier for student ID ${studentId} not found`));
      return;
    }
    if (!isDeleted) {
      res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete academicIdentifier"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", null, "academicIdentifier deleted successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllAcademicIdentifiersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const identifiers = await getAllAcademicIdentifiers();
    res.status(200).json(new ApiResponse(200, "SUCCESS", identifiers, "Fetched all academic identifiers successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};