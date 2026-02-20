import { Request, Response, NextFunction } from "express";
import {
  createUserStatusMasterFrequencySchema,
  UserStatusMasterFrequency,
} from "@repo/db/schemas/models/user";
import {
  addUserStatusMasterFrequency,
  findUserStatusMasterFrequencyById,
  findUserStatusMasterFrequenciesByMasterId,
  updateUserStatusMasterFrequency,
  removeUserStatusMasterFrequency,
  getAllUserStatusMasterFrequencies,
} from "../services/user-status-master-frequency.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";

export const createUserStatusMasterFrequencyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parse = createUserStatusMasterFrequencySchema.safeParse(req.body);
    if (!parse.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parse.error.flatten()),
          ),
        );
      return;
    }

    const created = await addUserStatusMasterFrequency(
      req.body as UserStatusMasterFrequency,
    );
    if (!created) {
      res
        .status(500)
        .json(new ApiResponse(500, "ERROR", null, "Failed to create"));
      return;
    }
    res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Created"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStatusMasterFrequencyById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const found = await findUserStatusMasterFrequencyById(id);
    if (!found) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Not found"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", found, "Fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStatusMasterFrequenciesByMasterId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const masterId = Number(req.params.masterId);
    if (isNaN(masterId)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const rows = await findUserStatusMasterFrequenciesByMasterId(masterId);
    res.status(200).json(new ApiResponse(200, "SUCCESS", rows, "Fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateUserStatusMasterFrequencyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.body) {
    res
      .status(400)
      .json(
        new ApiResponse(
          400,
          "BAD_REQUEST",
          null,
          "Fields content can not be empty",
        ),
      );
    return;
  }
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const parse = createUserStatusMasterFrequencySchema.safeParse(req.body);
    if (!parse.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parse.error.flatten()),
          ),
        );
      return;
    }
    const updated = await updateUserStatusMasterFrequency(
      id,
      req.body as UserStatusMasterFrequency,
    );
    if (!updated) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Not found"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Updated"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUserStatusMasterFrequencyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const deleted = await removeUserStatusMasterFrequency(id);
    if (deleted === null) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Not found"));
      return;
    }
    if (!deleted) {
      res
        .status(500)
        .json(new ApiResponse(500, "ERROR", null, "Failed to delete"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", null, "Deleted"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllUserStatusMasterFrequenciesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await getAllUserStatusMasterFrequencies();
    res.status(200).json(new ApiResponse(200, "SUCCESS", rows, "Fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
};
