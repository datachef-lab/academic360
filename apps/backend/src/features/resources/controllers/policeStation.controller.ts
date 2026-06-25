import { NextFunction, Response, Request } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  findAllPoliceStations,
  findPoliceStationById,
  createPoliceStation as createPoliceStationService,
  updatePoliceStation as updatePoliceStationService,
  deletePoliceStation as deletePoliceStationService,
} from "@/features/resources/services/policeStation.service.js";

export const createPoliceStation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, stateId, legacyPoliceStationId } = req.body;
    if (!name || typeof name !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Name is required and must be a string"));
      return;
    }
    const created = await createPoliceStationService({
      name,
      stateId: stateId ? Number(stateId) : null,
      // legacyPoliceStationId is NOT NULL with no default; use 0 for new rows.
      legacyPoliceStationId: legacyPoliceStationId ?? 0,
    });
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Police station created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllPoliceStation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await findAllPoliceStations();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "All police stations fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getPoliceStationById = async (
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
    const row = await findPoliceStationById(id);
    if (!row) {
      res.status(404).json(new ApiError(404, "Police station not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Police station fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePoliceStationRecord = async (
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
    const { name, stateId } = req.body;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (stateId !== undefined) data.stateId = stateId ? Number(stateId) : null;
    const updated = await updatePoliceStationService(id, data);
    if (!updated) {
      res.status(404).json(new ApiError(404, "Police station not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Police station updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deletePoliceStationRecord = async (
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
    const deleted = await deletePoliceStationService(id);
    if (!deleted) {
      res.status(404).json(new ApiError(404, "Police station not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Police station deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
