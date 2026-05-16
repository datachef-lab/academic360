import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createAccessGroupModulePermission as createAccessGroupModulePermissionService,
  deleteAccessGroupModulePermissionSafe as deleteAccessGroupModulePermissionSafeService,
  findAccessGroupModulePermissionById,
  getAllAccessGroupModulePermissions as getAllAccessGroupModulePermissionsService,
  updateAccessGroupModulePermission as updateAccessGroupModulePermissionService,
} from "../services/access-group-module-permission.service.js";

export const createAccessGroupModulePermission = async (
  req: Request,
  res: Response,
) => {
  try {
    const created = await createAccessGroupModulePermissionService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Access group module permission created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllAccessGroupModulePermissions = async (
  _req: Request,
  res: Response,
) => {
  try {
    const all = await getAllAccessGroupModulePermissionsService();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          all,
          "Access group module permissions fetched.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getAccessGroupModulePermissionById = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const found = await findAccessGroupModulePermissionById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group module permission not found.",
          ),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          found,
          "Access group module permission fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateAccessGroupModulePermission = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateAccessGroupModulePermissionService(
      id,
      req.body,
    );

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group module permission not found.",
          ),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "Access group module permission updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteAccessGroupModulePermission = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await deleteAccessGroupModulePermissionSafeService(
      Number(req.params.id),
    );

    if (result === null) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group module permission not found.",
          ),
        );
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
