import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { Qualification } from "@/features/resources/models/qualification.model.js";
import {
  findAllQualifications,
  findQualificationById,
  createQualification as createQualificationService,
  updateQualification as updateQualificationService,
  deleteQualification as deleteQualificationService,
  findQualificationByName,
} from "@/features/resources/services/qualification.service.js";

// Create a new qualification
export const createNewQualification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, sequence, disabled } = req.body;

    // Basic validation
    if (!name || typeof name !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Name is required and must be a string"));
      return;
    }

    // Check if name already exists (case-insensitive)
    const existingName = await findQualificationByName(name);
    if (existingName) {
      res
        .status(409)
        .json(new ApiError(409, "Qualification name already exists"));
      return;
    }

    const qualificationData = {
      name: name.toUpperCase().trim(),
      sequence: sequence || null,
      disabled: disabled || false,
    };

    const newQualification =
      await createQualificationService(qualificationData);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newQualification,
          "Qualification created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all qualifications
export const getAllQualification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const qualifications = await findAllQualifications();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          qualifications,
          "All qualifications fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get qualification by ID
export const getQualificationById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const qualification = await findQualificationById(Number(id));

    if (!qualification) {
      res.status(404).json(new ApiError(404, "Qualification not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          qualification,
          "Qualification fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update qualification
export const updateQualification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, sequence, disabled } = req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    // Check if qualification exists
    const existingQualification = await findQualificationById(Number(id));
    if (!existingQualification) {
      res.status(404).json(new ApiError(404, "Qualification not found"));
      return;
    }

    // If name is being updated, check for duplicates (case-insensitive)
    if (name && name.toUpperCase().trim() !== existingQualification.name) {
      const duplicateName = await findQualificationByName(name);
      if (duplicateName) {
        res
          .status(409)
          .json(new ApiError(409, "Qualification name already exists"));
        return;
      }
    }

    const updateData: Partial<
      Omit<Qualification, "id" | "createdAt" | "updatedAt">
    > = {};

    if (name !== undefined) updateData.name = name.toUpperCase().trim();
    if (sequence !== undefined) updateData.sequence = sequence;
    if (disabled !== undefined) updateData.disabled = disabled;

    const updatedQualification = await updateQualificationService(
      Number(id),
      updateData,
    );

    if (!updatedQualification) {
      res.status(404).json(new ApiError(404, "Qualification not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedQualification,
          "Qualification updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete qualification
export const deleteQualifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    // Check if qualification exists
    const existingQualification = await findQualificationById(Number(id));
    if (!existingQualification) {
      res.status(404).json(new ApiError(404, "Qualification not found"));
      return;
    }

    const deletedQualification = await deleteQualificationService(Number(id));

    if (!deletedQualification) {
      res.status(404).json(new ApiError(404, "Qualification not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deletedQualification,
          "Qualification deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
