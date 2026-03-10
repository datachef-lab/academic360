import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createUserStatus,
  deleteUserStatus,
  getAllUserStatuses,
  getUserStatusById,
  getUserStatusByName,
  updateUserStatus,
} from "@/features/administration/services/user-status.service.js";

export const createUserStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, isActive } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "User status name is required"));
      return;
    }

    const normalizedName = name.trim();
    const existing = await getUserStatusByName(normalizedName);
    if (existing) {
      res
        .status(409)
        .json(new ApiError(409, "User status name already exists"));
      return;
    }

    const createPayload = {
      name: normalizedName,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };
    const userStatus = await createUserStatus(createPayload);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          userStatus,
          "User status created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStatusesHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userStatuses = await getAllUserStatuses();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          userStatuses,
          "User statuses fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStatusByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const statusId = Number(id);

    if (!id || Number.isNaN(statusId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user status ID is required"));
      return;
    }

    const userStatus = await getUserStatusById(statusId);
    if (!userStatus) {
      res.status(404).json(new ApiError(404, "User status not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          userStatus,
          "User status fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateUserStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const statusId = Number(id);

    if (!id || Number.isNaN(statusId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user status ID is required"));
      return;
    }

    const existing = await getUserStatusById(statusId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "User status not found"));
      return;
    }

    const { name, isActive } = req.body;

    const updatePayload: Partial<{ name: string; isActive: boolean }> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res
          .status(400)
          .json(
            new ApiError(400, "User status name must be a non-empty string"),
          );
        return;
      }
      const normalizedName = name.trim();
      if (normalizedName !== existing.name) {
        const duplicate = await getUserStatusByName(normalizedName);
        if (duplicate && duplicate.id !== statusId) {
          res
            .status(409)
            .json(new ApiError(409, "User status name already exists"));
          return;
        }
      }
      updatePayload.name = normalizedName;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        res.status(400).json(new ApiError(400, "isActive must be a boolean"));
        return;
      }
      updatePayload.isActive = isActive;
    }

    if (Object.keys(updatePayload).length === 0) {
      res
        .status(400)
        .json(new ApiError(400, "No valid fields provided for update"));
      return;
    }

    const updated = await updateUserStatus(statusId, updatePayload);

    if (!updated) {
      res.status(404).json(new ApiError(404, "User status not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "User status updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUserStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const statusId = Number(id);

    if (!id || Number.isNaN(statusId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user status ID is required"));
      return;
    }

    const existing = await getUserStatusById(statusId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "User status not found"));
      return;
    }

    await deleteUserStatus(statusId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "User status deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
