import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { State } from "@/features/resources/models/state.model.js";
import {
  findAllStates,
  findStateById,
  createState as createStateService,
  updateState as updateStateService,
  deleteState as deleteStateService,
  findStateByName,
  findStatesByCountryId,
} from "@/features/resources/services/state.service.js";

// Create a new state
export const createState = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { countryId, name, sequence, disabled } = req.body;

    // Basic validation
    if (!countryId || typeof countryId !== "number") {
      res
        .status(400)
        .json(new ApiError(400, "Country ID is required and must be a number"));
      return;
    }

    if (!name || typeof name !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Name is required and must be a string"));
      return;
    }

    // Check if name already exists (case-insensitive)
    const existingName = await findStateByName(name);
    if (existingName) {
      res.status(409).json(new ApiError(409, "State name already exists"));
      return;
    }

    const stateData = {
      countryId,
      name: name.toUpperCase().trim(),
      sequence: sequence || null,
      disabled: disabled || false,
    };

    const newState = await createStateService(stateData);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newState,
          "State created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all states
export const getAllState = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const states = await findAllStates();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          states,
          "All states fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get states by country ID
export const getStatesByCountryId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { countryId } = req.params;

    if (!countryId || isNaN(Number(countryId))) {
      res.status(400).json(new ApiError(400, "Valid country ID is required"));
      return;
    }

    const states = await findStatesByCountryId(Number(countryId));

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", states, "States fetched successfully!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get state by ID
export const getStateById = async (
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

    const state = await findStateById(Number(id));

    if (!state) {
      res.status(404).json(new ApiError(404, "State not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", state, "State fetched successfully!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update state
export const updateStateRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { countryId, name, sequence, disabled } = req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    // Check if state exists
    const existingState = await findStateById(Number(id));
    if (!existingState) {
      res.status(404).json(new ApiError(404, "State not found"));
      return;
    }

    // If name is being updated, check for duplicates (case-insensitive)
    if (name && name.toUpperCase().trim() !== existingState.name) {
      const duplicateName = await findStateByName(name);
      if (duplicateName) {
        res.status(409).json(new ApiError(409, "State name already exists"));
        return;
      }
    }

    const updateData: Partial<Omit<State, "id" | "createdAt" | "updatedAt">> =
      {};

    if (countryId !== undefined) updateData.countryId = countryId;
    if (name !== undefined) updateData.name = name.toUpperCase().trim();
    if (sequence !== undefined) updateData.sequence = sequence;
    if (disabled !== undefined) updateData.disabled = disabled;

    const updatedState = await updateStateService(Number(id), updateData);

    if (!updatedState) {
      res.status(404).json(new ApiError(404, "State not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedState,
          "State updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete state
export const deleteStateRecord = async (
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

    // Check if state exists
    const existingState = await findStateById(Number(id));
    if (!existingState) {
      res.status(404).json(new ApiError(404, "State not found"));
      return;
    }

    const deletedState = await deleteStateService(Number(id));

    if (!deletedState) {
      res.status(404).json(new ApiError(404, "State not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deletedState,
          "State deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
