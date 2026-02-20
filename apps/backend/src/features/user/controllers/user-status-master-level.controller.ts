import { Request, Response, NextFunction } from "express";
import {
  createUserStatusMasterLevelSchema,
  UserStatusMasterLevel,
} from "@repo/db/schemas/models/user";
import {
  addUserStatusMasterLevel,
  findUserStatusMasterLevelById,
  findUserStatusMasterLevelsByMasterId,
  updateUserStatusMasterLevel,
  removeUserStatusMasterLevel,
  getAllUserStatusMasterLevels,
} from "../services/user-status-master-level.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";

export const createUserStatusMasterLevelController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parse = createUserStatusMasterLevelSchema.safeParse(req.body);
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
    const created = await addUserStatusMasterLevel(
      req.body as UserStatusMasterLevel,
    );
    res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Created"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStatusMasterLevelById = async (
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
    const found = await findUserStatusMasterLevelById(id);
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

export const getUserStatusMasterLevelsByMasterId = async (
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
    const rows = await findUserStatusMasterLevelsByMasterId(masterId);
    res.status(200).json(new ApiResponse(200, "SUCCESS", rows, "Fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateUserStatusMasterLevelController = async (
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
    const parse = createUserStatusMasterLevelSchema.safeParse(req.body);
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
    const updated = await updateUserStatusMasterLevel(
      id,
      req.body as UserStatusMasterLevel,
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

export const deleteUserStatusMasterLevelController = async (
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
    const deleted = await removeUserStatusMasterLevel(id);
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

export const getAllUserStatusMasterLevelsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await getAllUserStatusMasterLevels();
    res.status(200).json(new ApiResponse(200, "SUCCESS", rows, "Fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
};
