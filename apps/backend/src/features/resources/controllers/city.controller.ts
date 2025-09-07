import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { City } from "@/features/resources/models/city.model.js";
import {
  findAllCities,
  findCityById,
  createCity as createCityService,
  updateCity as updateCityService,
  deleteCity as deleteCityService,
  findCityByName,
  findCityByCode,
} from "@/features/resources/services/city.service.js";

// Create a new city
export const createNewCity = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { stateId, name, documentRequired, code, sequence, disabled } =
      req.body;

    // Basic validation
    if (!stateId || isNaN(Number(stateId))) {
      res.status(400).json(new ApiError(400, "Valid state ID is required"));
      return;
    }

    if (!name || typeof name !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Name is required and must be a string"));
      return;
    }

    if (!code || typeof code !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Code is required and must be a string"));
      return;
    }

    if (code.length > 10) {
      res
        .status(400)
        .json(new ApiError(400, "Code must be less than 10 characters"));
      return;
    }

    // Check if name already exists
    const existingName = await findCityByName(name);
    if (existingName) {
      res.status(409).json(new ApiError(409, "City name already exists"));
      return;
    }

    // Check if code already exists
    const existingCode = await findCityByCode(code);
    if (existingCode) {
      res.status(409).json(new ApiError(409, "City code already exists"));
      return;
    }

    const cityData = {
      stateId: Number(stateId),
      name,
      documentRequired: documentRequired || false,
      code,
      sequence: sequence || null,
      disabled: disabled || false,
    };

    const newCity = await createCityService(cityData);

    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", newCity, "City created successfully!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all cities
export const getAllCity = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const cities = await findAllCities();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          cities,
          "All cities fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get city by ID
export const getCitiesById = async (
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

    const city = await findCityById(Number(id));

    if (!city) {
      res.status(404).json(new ApiError(404, "City not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", city, "City fetched successfully!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update city
export const updateCity = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { stateId, name, documentRequired, code, sequence, disabled } =
      req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    // Check if city exists
    const existingCity = await findCityById(Number(id));
    if (!existingCity) {
      res.status(404).json(new ApiError(404, "City not found"));
      return;
    }

    // Validate state ID if provided
    if (stateId && isNaN(Number(stateId))) {
      res.status(400).json(new ApiError(400, "Valid state ID is required"));
      return;
    }

    // Validate code length if provided
    if (code && code.length > 10) {
      res
        .status(400)
        .json(new ApiError(400, "Code must be less than 10 characters"));
      return;
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingCity.name) {
      const duplicateName = await findCityByName(name);
      if (duplicateName) {
        res.status(409).json(new ApiError(409, "City name already exists"));
        return;
      }
    }

    // If code is being updated, check for duplicates
    if (code && code !== existingCity.code) {
      const duplicateCode = await findCityByCode(code);
      if (duplicateCode) {
        res.status(409).json(new ApiError(409, "City code already exists"));
        return;
      }
    }

    const updateData: Partial<Omit<City, "id" | "createdAt" | "updatedAt">> =
      {};

    if (stateId !== undefined) updateData.stateId = Number(stateId);
    if (name !== undefined) updateData.name = name;
    if (documentRequired !== undefined)
      updateData.documentRequired = documentRequired;
    if (code !== undefined) updateData.code = code;
    if (sequence !== undefined) updateData.sequence = sequence;
    if (disabled !== undefined) updateData.disabled = disabled;

    const updatedCity = await updateCityService(Number(id), updateData);

    if (!updatedCity) {
      res.status(404).json(new ApiError(404, "City not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedCity,
          "City updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete city
export const deleteCity = async (
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

    // Check if city exists
    const existingCity = await findCityById(Number(id));
    if (!existingCity) {
      res.status(404).json(new ApiError(404, "City not found"));
      return;
    }

    const deletedCity = await deleteCityService(Number(id));

    if (!deletedCity) {
      res.status(404).json(new ApiError(404, "City not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deletedCity,
          "City deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
