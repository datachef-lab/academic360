import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createFloor as createFloorService,
  deleteFloorSafe as deleteFloorSafeService,
  findFloorById,
  getAllFloors as getAllFloorsService,
  updateFloor as updateFloorService,
} from "../services/floor.service.js";

export const createFloor = async (req: Request, res: Response) => {
  try {
    const created = await createFloorService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", created, "Floor created successfully."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllFloors = async (_req: Request, res: Response) => {
  try {
    const floors = await getAllFloorsService();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", floors, "Floors fetched."));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getFloorById = async (req: Request, res: Response) => {
  try {
    const floor = await findFloorById(Number(req.params.id));
    if (!floor) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Floor not found."));
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", floor, "Floor fetched successfully."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateFloor = async (req: Request, res: Response) => {
  try {
    const updated = await updateFloorService(Number(req.params.id), req.body);
    if (!updated) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Floor not found."));
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "UPDATED", updated, "Floor updated successfully."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteFloor = async (req: Request, res: Response) => {
  try {
    const result = await deleteFloorSafeService(Number(req.params.id));

    if (result === null) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Floor not found."));
    }

    if (result.success === false) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", result.records, result.message));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "DELETED", null, result.message ?? "Deleted."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};
