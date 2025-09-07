import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { Degree } from "@/features/resources/models/degree.model.js";
import {
  findAllDegrees,
  findDegreeById,
  createDegree as createDegreeService,
  updateDegree as updateDegreeService,
  deleteDegree as deleteDegreeService,
  findDegreeByName,
} from "@/features/resources/services/degree.service.js";

// Create a new degree
export const createDegree = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, level, sequence, disabled } = req.body;

    // Basic validation
    if (!name || typeof name !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Name is required and must be a string"));
      return;
    }

    // Check if name already exists
    const existingName = await findDegreeByName(name);
    if (existingName) {
      res.status(409).json(new ApiError(409, "Degree name already exists"));
      return;
    }

    const degreeData = {
      name,
      level: level || null,
      sequence: sequence || null,
      disabled: disabled || false,
    };

    const newDegree = await createDegreeService(degreeData);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newDegree,
          "Degree created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all degrees
export const getAllDegree = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const degrees = await findAllDegrees();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          degrees,
          "All degrees fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get degree by ID
export const getDegreeById = async (
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

    const degree = await findDegreeById(Number(id));

    if (!degree) {
      res.status(404).json(new ApiError(404, "Degree not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", degree, "Degree fetched successfully!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update degree
export const updateDegree = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, level, sequence, disabled } = req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    // Check if degree exists
    const existingDegree = await findDegreeById(Number(id));
    if (!existingDegree) {
      res.status(404).json(new ApiError(404, "Degree not found"));
      return;
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingDegree.name) {
      const duplicateName = await findDegreeByName(name);
      if (duplicateName) {
        res.status(409).json(new ApiError(409, "Degree name already exists"));
        return;
      }
    }

    const updateData: Partial<Omit<Degree, "id" | "createdAt" | "updatedAt">> =
      {};

    if (name !== undefined) updateData.name = name;
    if (level !== undefined) updateData.level = level;
    if (sequence !== undefined) updateData.sequence = sequence;
    if (disabled !== undefined) updateData.disabled = disabled;

    const updatedDegree = await updateDegreeService(Number(id), updateData);

    if (!updatedDegree) {
      res.status(404).json(new ApiError(404, "Degree not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedDegree,
          "Degree updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete degree
export const deleteDegree = async (
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

    // Check if degree exists
    const existingDegree = await findDegreeById(Number(id));
    if (!existingDegree) {
      res.status(404).json(new ApiError(404, "Degree not found"));
      return;
    }

    const deletedDegree = await deleteDegreeService(Number(id));

    if (!deletedDegree) {
      res.status(404).json(new ApiError(404, "Degree not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deletedDegree,
          "Degree deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
