import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { createAccommodationSchema, updateAccommodationSchema } from "@/features/user/models/accommodation.model.js";
import { addAccommodation, findAccommotionById, findAccommotionByStudentId, updateAccommodation as updateAccommodationService, removeAccommodation, removeAccommodationByStudentId, getAllAccommodations } from "@/features/user/services/accommodation.service.js";
import { AccommodationType } from "@/types/user/accommodation.js";

export const createAccommodation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.body) {
    res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Fields content can not be empty"));
    return;
  }
  try {
    const parseResult = createAccommodationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(new ApiResponse(400, "VALIDATION_ERROR", null, JSON.stringify(parseResult.error.flatten())));
      return;
    }
    const newAccommodation = await addAccommodation(req.body as AccommodationType);
    if (!newAccommodation) {
      res.status(409).json(new ApiResponse(409, "CONFLICT", null, "Accommodation already exists for this student"));
      return;
    }
    res.status(201).json(new ApiResponse(201, "SUCCESS", newAccommodation, "New accommodation is added to db!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAccommodationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const foundAccommodation = await findAccommotionById(id);
    if (!foundAccommodation) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `accommodation of ID ${id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", foundAccommodation, "Fetched accommodation successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAccommodationByStudentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = Number(req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid student ID format"));
      return;
    }
    const foundAccommodation = await findAccommotionByStudentId(studentId);
    if (!foundAccommodation) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `accommodation of studentId: ${studentId} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", foundAccommodation, "Fetched accommodation successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAccommodation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const parseResult = updateAccommodationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(new ApiResponse(400, "VALIDATION_ERROR", null, JSON.stringify(parseResult.error.flatten())));
      return;
    }
    const updatedAccommodation = await updateAccommodationService(id, req.body);
    if (!updatedAccommodation) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "accommodation not found"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", updatedAccommodation, "Accommodation updated successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAccommodation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const isDeleted = await removeAccommodation(id);
    if (isDeleted === null) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `accommodation with ID ${id} not found`));
      return;
    }
    if (!isDeleted) {
      res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete accommodation"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", null, "Accommodation deleted successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAccommodationByStudentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = Number(req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid student ID format"));
      return;
    }
    const isDeleted = await removeAccommodationByStudentId(studentId);
    if (isDeleted === null) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `accommodation for student ID ${studentId} not found`));
      return;
    }
    if (!isDeleted) {
      res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete accommodation"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", null, "Accommodation deleted successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllAccommodationsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accommodations = await getAllAccommodations();
    res.status(200).json(new ApiResponse(200, "SUCCESS", accommodations, "Fetched all accommodations successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};