import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createUserPrivilege,
  deleteUserPrivilege,
  getAllUserPrivileges,
  getUserPrivilegeById,
  getUserPrivilegeByGroupAndStatus,
  getUserPrivilegesByGroupId,
  getUserPrivilegesByStatusId,
  updateUserPrivilege,
} from "@/features/administration/services/user-privilege.service.js";

export const createUserPrivilegeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userGroupId, userStatusId, isActive } = req.body;

    if (typeof userGroupId !== "number" || Number.isNaN(userGroupId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid userGroupId (number) is required"));
      return;
    }

    if (typeof userStatusId !== "number" || Number.isNaN(userStatusId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid userStatusId (number) is required"));
      return;
    }

    const existing = await getUserPrivilegeByGroupAndStatus(
      userGroupId,
      userStatusId,
    );
    if (existing) {
      res
        .status(409)
        .json(
          new ApiError(
            409,
            "A privilege already exists for this user group and status combination",
          ),
        );
      return;
    }

    const createPayload = {
      userGroupId,
      userStatusId,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };
    const created = await createUserPrivilege(createPayload);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "User privilege created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserPrivilegesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userGroupIdParam = req.query.userGroupId as string | undefined;
    const userStatusIdParam = req.query.userStatusId as string | undefined;

    if (userGroupIdParam !== undefined) {
      const userGroupId = Number(userGroupIdParam);
      if (Number.isNaN(userGroupId)) {
        res
          .status(400)
          .json(new ApiError(400, "userGroupId must be a valid number"));
        return;
      }
      const privileges = await getUserPrivilegesByGroupId(userGroupId);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            privileges,
            "User privileges fetched successfully",
          ),
        );
    } else if (userStatusIdParam !== undefined) {
      const userStatusId = Number(userStatusIdParam);
      if (Number.isNaN(userStatusId)) {
        res
          .status(400)
          .json(new ApiError(400, "userStatusId must be a valid number"));
        return;
      }
      const privileges = await getUserPrivilegesByStatusId(userStatusId);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            privileges,
            "User privileges fetched successfully",
          ),
        );
    } else {
      const privileges = await getAllUserPrivileges();
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            privileges,
            "User privileges fetched successfully",
          ),
        );
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserPrivilegeByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const privilegeId = Number(id);

    if (!id || Number.isNaN(privilegeId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user privilege ID is required"));
      return;
    }

    const privilege = await getUserPrivilegeById(privilegeId);
    if (!privilege) {
      res.status(404).json(new ApiError(404, "User privilege not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          privilege,
          "User privilege fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateUserPrivilegeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const privilegeId = Number(id);

    if (!id || Number.isNaN(privilegeId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user privilege ID is required"));
      return;
    }

    const existing = await getUserPrivilegeById(privilegeId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "User privilege not found"));
      return;
    }

    const { isActive } = req.body;

    const updatePayload: Partial<{ isActive: boolean }> = {};

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

    const updated = await updateUserPrivilege(privilegeId, updatePayload);

    if (!updated) {
      res.status(404).json(new ApiError(404, "User privilege not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "User privilege updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUserPrivilegeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const privilegeId = Number(id);

    if (!id || Number.isNaN(privilegeId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user privilege ID is required"));
      return;
    }

    const existing = await getUserPrivilegeById(privilegeId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "User privilege not found"));
      return;
    }

    await deleteUserPrivilege(privilegeId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "User privilege deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
