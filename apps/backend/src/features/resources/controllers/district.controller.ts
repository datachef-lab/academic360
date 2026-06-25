import { NextFunction, Response, Request } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  findAllDistricts,
  findDistrictById,
  createDistrict as createDistrictService,
  updateDistrict as updateDistrictService,
  deleteDistrict as deleteDistrictService,
} from "@/features/resources/services/district.service.js";

export const createDistrict = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, cityId, sequence, isActive, legacyDistrictId } = req.body;
    if (!name || typeof name !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Name is required and must be a string"));
      return;
    }
    if (!cityId) {
      res.status(400).json(new ApiError(400, "City is required"));
      return;
    }
    const created = await createDistrictService({
      name,
      cityId: Number(cityId),
      sequence: sequence ?? null,
      isActive: isActive ?? true,
      legacyDistrictId: legacyDistrictId ?? null,
    });
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "District created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllDistrict = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await findAllDistricts();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "All districts fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getDistrictById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }
    const row = await findDistrictById(id);
    if (!row) {
      res.status(404).json(new ApiError(404, "District not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "District fetched successfully!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateDistrictRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }
    const { name, cityId, sequence, isActive } = req.body;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (cityId !== undefined) data.cityId = Number(cityId);
    if (sequence !== undefined) data.sequence = sequence;
    if (isActive !== undefined) data.isActive = isActive;
    const updated = await updateDistrictService(id, data);
    if (!updated) {
      res.status(404).json(new ApiError(404, "District not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "District updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteDistrictRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }
    const deleted = await deleteDistrictService(id);
    if (!deleted) {
      res.status(404).json(new ApiError(404, "District not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "District deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
