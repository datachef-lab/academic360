import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createUserPrivilegeSub,
  deleteUserPrivilegeSub,
  getAllUserPrivilegeSubs,
  getUserPrivilegeSubById,
  getUserPrivilegeSubsByPrivilegeId,
  updateUserPrivilegeSub,
} from "@/features/administration/services/user-privilege-sub.service.js";

export const createUserPrivilegeSubHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      userPrivilegeId,
      appModuleId,
      programCourseId,
      departmentId,
      isAccessible,
    } = req.body;

    if (typeof userPrivilegeId !== "number" || Number.isNaN(userPrivilegeId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid userPrivilegeId (number) is required"));
      return;
    }

    if (typeof appModuleId !== "number" || Number.isNaN(appModuleId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid appModuleId (number) is required"));
      return;
    }

    const created = await createUserPrivilegeSub({
      userPrivilegeId,
      appModuleId,
      programCourseId:
        programCourseId !== undefined && programCourseId !== null
          ? Number(programCourseId)
          : null,
      departmentId:
        departmentId !== undefined && departmentId !== null
          ? Number(departmentId)
          : null,
      isAccessible: typeof isAccessible === "boolean" ? isAccessible : true,
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "User privilege sub (resource) created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserPrivilegeSubsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userPrivilegeIdParam = req.query.userPrivilegeId as
      | string
      | undefined;

    if (userPrivilegeIdParam !== undefined) {
      const userPrivilegeId = Number(userPrivilegeIdParam);
      if (Number.isNaN(userPrivilegeId)) {
        res
          .status(400)
          .json(new ApiError(400, "userPrivilegeId must be a valid number"));
        return;
      }
      const subs = await getUserPrivilegeSubsByPrivilegeId(userPrivilegeId);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            subs,
            "User privilege resources fetched successfully",
          ),
        );
    } else {
      const subs = await getAllUserPrivilegeSubs();
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            subs,
            "User privilege resources fetched successfully",
          ),
        );
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserPrivilegeSubByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const subId = Number(id);

    if (!id || Number.isNaN(subId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user privilege sub ID is required"));
      return;
    }

    const sub = await getUserPrivilegeSubById(subId);
    if (!sub) {
      res
        .status(404)
        .json(new ApiError(404, "User privilege resource not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          sub,
          "User privilege resource fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateUserPrivilegeSubHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const subId = Number(id);

    if (!id || Number.isNaN(subId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user privilege sub ID is required"));
      return;
    }

    const existing = await getUserPrivilegeSubById(subId);
    if (!existing) {
      res
        .status(404)
        .json(new ApiError(404, "User privilege resource not found"));
      return;
    }

    const { programCourseId, departmentId, isAccessible } = req.body;

    const updatePayload: Partial<{
      programCourseId: number | null;
      departmentId: number | null;
      isAccessible: boolean;
    }> = {};

    if (programCourseId !== undefined) {
      updatePayload.programCourseId =
        programCourseId === null ? null : Number(programCourseId);
    }

    if (departmentId !== undefined) {
      updatePayload.departmentId =
        departmentId === null ? null : Number(departmentId);
    }

    if (isAccessible !== undefined) {
      if (typeof isAccessible !== "boolean") {
        res
          .status(400)
          .json(new ApiError(400, "isAccessible must be a boolean"));
        return;
      }
      updatePayload.isAccessible = isAccessible;
    }

    if (Object.keys(updatePayload).length === 0) {
      res
        .status(400)
        .json(new ApiError(400, "No valid fields provided for update"));
      return;
    }

    const updated = await updateUserPrivilegeSub(subId, updatePayload);

    if (!updated) {
      res
        .status(404)
        .json(new ApiError(404, "User privilege resource not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "User privilege resource updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUserPrivilegeSubHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const subId = Number(id);

    if (!id || Number.isNaN(subId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user privilege sub ID is required"));
      return;
    }

    const existing = await getUserPrivilegeSubById(subId);
    if (!existing) {
      res
        .status(404)
        .json(new ApiError(404, "User privilege resource not found"));
      return;
    }

    await deleteUserPrivilegeSub(subId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "User privilege resource deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
