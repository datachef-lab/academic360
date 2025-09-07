import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { Occupation } from "@/features/resources/models/occupation.model.js";
import {
  findAllOccupations,
  findOccupationById,
  createOccupation as createOccupationService,
  updateOccupation as updateOccupationService,
  deleteOccupation as deleteOccupationService,
  findOccupationByName,
} from "@/features/resources/services/occupation.service.js";

// Create a new occupation
export const createOccupation = async (
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
    const existingName = await findOccupationByName(name);
    if (existingName) {
      res.status(409).json(new ApiError(409, "Occupation name already exists"));
      return;
    }

    const occupationData = {
      name: name.toUpperCase().trim(),
      sequence: sequence || null,
      disabled: disabled || false,
    };

    const newOccupation = await createOccupationService(occupationData);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newOccupation,
          "Occupation created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all occupations
export const getAllOccupation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const occupations = await findAllOccupations();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          occupations,
          "All occupations fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get occupation by ID
export const getOccupationById = async (
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

    const occupation = await findOccupationById(Number(id));

    if (!occupation) {
      res.status(404).json(new ApiError(404, "Occupation not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          occupation,
          "Occupation fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update occupation
export const updateOccupation = async (
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

    // Check if occupation exists
    const existingOccupation = await findOccupationById(Number(id));
    if (!existingOccupation) {
      res.status(404).json(new ApiError(404, "Occupation not found"));
      return;
    }

    // If name is being updated, check for duplicates (case-insensitive)
    if (name && name.toUpperCase().trim() !== existingOccupation.name) {
      const duplicateName = await findOccupationByName(name);
      if (duplicateName) {
        res
          .status(409)
          .json(new ApiError(409, "Occupation name already exists"));
        return;
      }
    }

    const updateData: Partial<
      Omit<Occupation, "id" | "createdAt" | "updatedAt">
    > = {};

    if (name !== undefined) updateData.name = name.toUpperCase().trim();
    if (sequence !== undefined) updateData.sequence = sequence;
    if (disabled !== undefined) updateData.disabled = disabled;

    const updatedOccupation = await updateOccupationService(
      Number(id),
      updateData,
    );

    if (!updatedOccupation) {
      res.status(404).json(new ApiError(404, "Occupation not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedOccupation,
          "Occupation updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete occupation
export const deleteOccupation = async (
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

    // Check if occupation exists
    const existingOccupation = await findOccupationById(Number(id));
    if (!existingOccupation) {
      res.status(404).json(new ApiError(404, "Occupation not found"));
      return;
    }

    const deletedOccupation = await deleteOccupationService(Number(id));

    if (!deletedOccupation) {
      res.status(404).json(new ApiError(404, "Occupation not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deletedOccupation,
          "Occupation deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
