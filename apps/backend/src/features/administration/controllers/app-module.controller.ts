import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createAppModule as createAppModuleService,
  deleteAppModuleSafe as deleteAppModuleSafeService,
  findAppModuleById,
  getAllAppModules as getAllAppModulesService,
  updateAppModule as updateAppModuleService,
} from "../services/app-module.service.js";

export const createAppModule = async (req: Request, res: Response) => {
  try {
    const created = await createAppModuleService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "App module created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllAppModules = async (_req: Request, res: Response) => {
  try {
    const all = await getAllAppModulesService();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", all, "App modules fetched."));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getAppModuleById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const found = await findAppModuleById(id);

    if (!found) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "App module not found."));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          found,
          "App module fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateAppModule = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateAppModuleService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "App module not found."));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "App module updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteAppModule = async (req: Request, res: Response) => {
  try {
    const result = await deleteAppModuleSafeService(Number(req.params.id));

    if (result === null) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "App module not found."));
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
