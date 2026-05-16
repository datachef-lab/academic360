import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createAccessGroupModule as createAccessGroupModuleService,
  deleteAccessGroupModuleSafe as deleteAccessGroupModuleSafeService,
  findAccessGroupModuleById,
  getAllAccessGroupModules as getAllAccessGroupModulesService,
  updateAccessGroupModule as updateAccessGroupModuleService,
} from "../services/access-group-module.service.js";

export const createAccessGroupModule = async (req: Request, res: Response) => {
  try {
    const created = await createAccessGroupModuleService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Access group module created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllAccessGroupModules = async (
  _req: Request,
  res: Response,
) => {
  try {
    const all = await getAllAccessGroupModulesService();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", all, "Access group modules fetched."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getAccessGroupModuleById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const found = await findAccessGroupModuleById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group module not found.",
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
          "Access group module fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateAccessGroupModule = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateAccessGroupModuleService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group module not found.",
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
          "Access group module updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteAccessGroupModule = async (req: Request, res: Response) => {
  try {
    const result = await deleteAccessGroupModuleSafeService(
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
            "Access group module not found.",
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
