import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createUserStatusReason,
  deleteUserStatusReason,
  getUserStatusReasonById,
  getUserStatusReasonByStatusAndName,
  getUserStatusReasonsByStatusId,
  getAllUserStatusReasons,
  updateUserStatusReason,
} from "@/features/administration/services/user-status-reason.service.js";

export const createUserStatusReasonHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userStatusId, name, description, remarks, isTerminal, isActive } =
      req.body;

    if (typeof userStatusId !== "number" || Number.isNaN(userStatusId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid userStatusId (number) is required"));
      return;
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Reason name is required"));
      return;
    }

    const normalizedName = name.trim();
    const existing = await getUserStatusReasonByStatusAndName(
      userStatusId,
      normalizedName,
    );
    if (existing) {
      res
        .status(409)
        .json(
          new ApiError(
            409,
            "This reason name already exists for this user status",
          ),
        );
      return;
    }

    const createPayload = {
      userStatusId,
      name: normalizedName,
      description:
        typeof description === "string" ? description.trim() || null : null,
      remarks: typeof remarks === "string" ? remarks.trim() || null : null,
      isTerminal: typeof isTerminal === "boolean" ? isTerminal : false,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };
    const created = await createUserStatusReason(createPayload);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "User status reason created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStatusReasonsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userStatusIdParam = req.query.userStatusId as string | undefined;

    if (userStatusIdParam !== undefined) {
      const userStatusId = Number(userStatusIdParam);
      if (Number.isNaN(userStatusId)) {
        res
          .status(400)
          .json(new ApiError(400, "userStatusId must be a valid number"));
        return;
      }
      const reasons = await getUserStatusReasonsByStatusId(userStatusId);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            reasons,
            "User status reasons fetched successfully",
          ),
        );
    } else {
      const reasons = await getAllUserStatusReasons();
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            reasons,
            "User status reasons fetched successfully",
          ),
        );
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStatusReasonByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const reasonId = Number(id);

    if (!id || Number.isNaN(reasonId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user status reason ID is required"));
      return;
    }

    const reason = await getUserStatusReasonById(reasonId);
    if (!reason) {
      res.status(404).json(new ApiError(404, "User status reason not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          reason,
          "User status reason fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateUserStatusReasonHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const reasonId = Number(id);

    if (!id || Number.isNaN(reasonId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user status reason ID is required"));
      return;
    }

    const existing = await getUserStatusReasonById(reasonId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "User status reason not found"));
      return;
    }

    const { name, description, remarks, isTerminal, isActive } = req.body;

    const updatePayload: Partial<{
      name: string;
      description: string | null;
      remarks: string | null;
      isTerminal: boolean;
      isActive: boolean;
    }> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res
          .status(400)
          .json(
            new ApiError(
              400,
              "User status reason name must be a non-empty string",
            ),
          );
        return;
      }
      const normalizedName = name.trim();
      if (normalizedName !== existing.name) {
        const duplicate = await getUserStatusReasonByStatusAndName(
          existing.status.id!,
          normalizedName,
        );
        if (duplicate && duplicate.id !== reasonId) {
          res
            .status(409)
            .json(
              new ApiError(
                409,
                "This reason name already exists for this user status",
              ),
            );
          return;
        }
      }
      updatePayload.name = normalizedName;
    }

    if (description !== undefined) {
      updatePayload.description =
        typeof description === "string" ? description.trim() || null : null;
    }

    if (remarks !== undefined) {
      updatePayload.remarks =
        typeof remarks === "string" ? remarks.trim() || null : null;
    }

    if (isTerminal !== undefined) {
      if (typeof isTerminal !== "boolean") {
        res.status(400).json(new ApiError(400, "isTerminal must be a boolean"));
        return;
      }
      updatePayload.isTerminal = isTerminal;
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

    const updated = await updateUserStatusReason(reasonId, updatePayload);

    if (!updated) {
      res.status(404).json(new ApiError(404, "User status reason not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "User status reason updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUserStatusReasonHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const reasonId = Number(id);

    if (!id || Number.isNaN(reasonId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user status reason ID is required"));
      return;
    }

    const existing = await getUserStatusReasonById(reasonId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "User status reason not found"));
      return;
    }

    await deleteUserStatusReason(reasonId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "User status reason deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
