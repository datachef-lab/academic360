import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { Religion } from "@/features/resources/models/religion.model.js";
import {
  findAllReligions,
  findReligionById,
  createReligion as createReligionService,
  updateReligion as updateReligionService,
  deleteReligion as deleteReligionService,
  findReligionByName,
} from "@/features/resources/services/religion.service.js";

// Create a new religion
export const createReligion = async (
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
    const existingName = await findReligionByName(name);
    if (existingName) {
      res.status(409).json(new ApiError(409, "Religion name already exists"));
      return;
    }

    const religionData = {
      name: name.toUpperCase().trim(),
      sequence: sequence || null,
      disabled: disabled || false,
    };

    const newReligion = await createReligionService(religionData);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newReligion,
          "Religion created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all religions
export const getAllReligion = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const religions = await findAllReligions();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          religions,
          "All religions fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get religion by ID
export const getReligionById = async (
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

    const religion = await findReligionById(Number(id));

    if (!religion) {
      res.status(404).json(new ApiError(404, "Religion not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          religion,
          "Religion fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update religion
export const updateReligionRecord = async (
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

    // Check if religion exists
    const existingReligion = await findReligionById(Number(id));
    if (!existingReligion) {
      res.status(404).json(new ApiError(404, "Religion not found"));
      return;
    }

    // If name is being updated, check for duplicates (case-insensitive)
    if (name && name.toUpperCase().trim() !== existingReligion.name) {
      const duplicateName = await findReligionByName(name);
      if (duplicateName) {
        res.status(409).json(new ApiError(409, "Religion name already exists"));
        return;
      }
    }

    const updateData: Partial<
      Omit<Religion, "id" | "createdAt" | "updatedAt">
    > = {};

    if (name !== undefined) updateData.name = name.toUpperCase().trim();
    if (sequence !== undefined) updateData.sequence = sequence;
    if (disabled !== undefined) updateData.disabled = disabled;

    const updatedReligion = await updateReligionService(Number(id), updateData);

    if (!updatedReligion) {
      res.status(404).json(new ApiError(404, "Religion not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedReligion,
          "Religion updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete religion
export const deleteReligionRecord = async (
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

    // Check if religion exists
    const existingReligion = await findReligionById(Number(id));
    if (!existingReligion) {
      res.status(404).json(new ApiError(404, "Religion not found"));
      return;
    }

    const deletedReligion = await deleteReligionService(Number(id));

    if (!deletedReligion) {
      res.status(404).json(new ApiError(404, "Religion not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deletedReligion,
          "Religion deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
