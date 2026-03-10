import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createUserGroup,
  deleteUserGroup,
  getAllUserGroups,
  getUserGroupById,
  getUserGroupByName,
  updateUserGroup,
} from "@/features/administration/services/user-group.service.js";

export const createUserGroupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, shortName, code, sequence, isActive } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "User group name is required"));
      return;
    }

    const normalizedName = name.trim();
    const existing = await getUserGroupByName(normalizedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "User group name already exists"));
      return;
    }

    const createPayload = {
      name: normalizedName,
      shortName:
        typeof shortName === "string" ? shortName.trim() || null : null,
      code: typeof code === "string" ? code.trim() || null : null,
      sequence: typeof sequence === "number" ? sequence : 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };
    const userGroup = await createUserGroup(createPayload);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          userGroup,
          "User group created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserGroupsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userGroups = await getAllUserGroups();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          userGroups,
          "User groups fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserGroupByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userGroupId = Number(id);

    if (!id || Number.isNaN(userGroupId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user group ID is required"));
      return;
    }

    const userGroup = await getUserGroupById(userGroupId);
    if (!userGroup) {
      res.status(404).json(new ApiError(404, "User group not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          userGroup,
          "User group fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateUserGroupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userGroupId = Number(id);

    if (!id || Number.isNaN(userGroupId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user group ID is required"));
      return;
    }

    const existing = await getUserGroupById(userGroupId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "User group not found"));
      return;
    }

    const { name, shortName, code, sequence, isActive } = req.body;

    const updatePayload: Partial<{
      name: string;
      shortName: string | null;
      code: string | null;
      sequence: number;
      isActive: boolean;
    }> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res
          .status(400)
          .json(
            new ApiError(400, "User group name must be a non-empty string"),
          );
        return;
      }
      const normalizedName = name.trim();
      if (normalizedName !== existing.name) {
        const duplicate = await getUserGroupByName(normalizedName);
        if (duplicate && duplicate.id !== userGroupId) {
          res
            .status(409)
            .json(new ApiError(409, "User group name already exists"));
          return;
        }
      }
      updatePayload.name = normalizedName;
    }

    if (shortName !== undefined) {
      updatePayload.shortName =
        typeof shortName === "string" ? shortName.trim() || null : null;
    }

    if (code !== undefined) {
      updatePayload.code =
        typeof code === "string" ? code.trim() || null : null;
    }

    if (sequence !== undefined) {
      if (typeof sequence !== "number" || Number.isNaN(sequence)) {
        res.status(400).json(new ApiError(400, "sequence must be a number"));
        return;
      }
      updatePayload.sequence = sequence;
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

    const updated = await updateUserGroup(userGroupId, updatePayload);

    if (!updated) {
      res.status(404).json(new ApiError(404, "User group not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "User group updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUserGroupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userGroupId = Number(id);

    if (!id || Number.isNaN(userGroupId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user group ID is required"));
      return;
    }

    const existing = await getUserGroupById(userGroupId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "User group not found"));
      return;
    }

    await deleteUserGroup(userGroupId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "User group deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
