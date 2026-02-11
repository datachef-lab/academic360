import { Request, Response, NextFunction } from "express";
import {
  createUserStatusMasterSchema,
  UserStatusMaster,
} from "@repo/db/schemas/models/user";
import { UserStatusMasterDto } from "@repo/db/dtos";
import {
  addUserStatusMaster,
  findUserStatusMasterById,
  updateUserStatusMaster,
  removeUserStatusMaster,
  getAllUserStatusMasters,
} from "../services/user-status-master.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";

export const createUserStatusMasterController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parse = createUserStatusMasterSchema.safeParse(req.body);
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
    const created = await addUserStatusMaster(req.body as UserStatusMaster);
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

export const getUserStatusMasterById = async (
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
    const found = await findUserStatusMasterById(id);
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

export const updateUserStatusMasterController = async (
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
    const parse = createUserStatusMasterSchema.safeParse(req.body);
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
    const updated = await updateUserStatusMaster(
      id,
      req.body as UserStatusMaster,
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

export const deleteUserStatusMasterController = async (
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
    const deleted = await removeUserStatusMaster(id);
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

export const getAllUserStatusMastersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await getAllUserStatusMasters();
    res.status(200).json(new ApiResponse(200, "SUCCESS", rows, "Fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
};
