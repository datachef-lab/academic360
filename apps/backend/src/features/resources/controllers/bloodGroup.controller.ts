import { NextFunction, Request, Response } from "express";
import { BloodGroup } from "@/features/resources/models/bloodGroup.model.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  findAllBloodGroups,
  findBloodGroupById,
  createBloodGroup as createBloodGroupService,
  updateBloodGroup as updateBloodGroupService,
  deleteBloodGroup as deleteBloodGroupService,
  findBloodGroupByType,
} from "@/features/resources/services/bloodGroup.service.js";

// Create a new blood group
export const createBloodGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { type, sequence, disabled } = req.body;

    // Basic validation
    if (!type || typeof type !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Type is required and must be a string"));
      return;
    }

    // Check if type already exists
    const existingType = await findBloodGroupByType(type);
    if (existingType) {
      res
        .status(409)
        .json(new ApiError(409, "Blood group type already exists"));
      return;
    }

    const bloodGroupData = {
      type,
      sequence: sequence || null,
      disabled: disabled || false,
    };

    const newBloodGroup = await createBloodGroupService(bloodGroupData);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newBloodGroup,
          "Blood group created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all blood groups
export const getAllBloodGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const bloodGroups = await findAllBloodGroups();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          bloodGroups,
          "All blood groups fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get a specific blood group
export const getBloodGroup = async (
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

    const bloodGroup = await findBloodGroupById(Number(id));

    if (!bloodGroup) {
      res.status(404).json(new ApiError(404, "Blood group not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          bloodGroup,
          "Blood group fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update a blood group
export const updateBloodGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, sequence, disabled } = req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    // Check if blood group exists
    const existingBloodGroup = await findBloodGroupById(Number(id));
    if (!existingBloodGroup) {
      res.status(404).json(new ApiError(404, "Blood group not found"));
      return;
    }

    // If type is being updated, check for duplicates
    if (type && type !== existingBloodGroup.type) {
      const duplicateType = await findBloodGroupByType(type);
      if (duplicateType) {
        res
          .status(409)
          .json(new ApiError(409, "Blood group type already exists"));
        return;
      }
    }

    const updateData: Partial<
      Omit<BloodGroup, "id" | "createdAt" | "updatedAt">
    > = {};

    if (type !== undefined) updateData.type = type;
    if (sequence !== undefined) updateData.sequence = sequence;
    if (disabled !== undefined) updateData.disabled = disabled;

    const updatedBloodGroup = await updateBloodGroupService(
      Number(id),
      updateData,
    );

    if (!updatedBloodGroup) {
      res.status(404).json(new ApiError(404, "Blood group not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedBloodGroup,
          "Blood group updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete a blood group
export const deleteBloodGroup = async (
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

    // Check if blood group exists
    const existingBloodGroup = await findBloodGroupById(Number(id));
    if (!existingBloodGroup) {
      res.status(404).json(new ApiError(404, "Blood group not found"));
      return;
    }

    const deletedBloodGroup = await deleteBloodGroupService(Number(id));

    if (!deletedBloodGroup) {
      res.status(404).json(new ApiError(404, "Blood group not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deletedBloodGroup,
          "Blood group deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
