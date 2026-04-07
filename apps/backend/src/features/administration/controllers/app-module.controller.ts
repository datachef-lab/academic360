import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import type {
  AppModuleCreateInput,
  AppModuleUpdateInput,
} from "../services/app-module.service.js";
import {
  createAppModule as createAppModuleService,
  deleteAppModuleSafe as deleteAppModuleSafeService,
  findAppModuleById,
  getAllAppModules as getAllAppModulesService,
  updateAppModule as updateAppModuleService,
} from "../services/app-module.service.js";

function parseFormDataBody(
  body: Record<string, unknown>,
): AppModuleCreateInput | AppModuleUpdateInput {
  const dataRaw = body.data ?? body.payload ?? body;
  const data = typeof dataRaw === "string" ? JSON.parse(dataRaw) : dataRaw;

  if (data.parentAppModule?.id != null) {
    data.parentAppModuleId = data.parentAppModule.id;
    delete data.parentAppModule;
  }
  if (data.parentAppModuleId === undefined && data.parentAppModule === null) {
    data.parentAppModuleId = null;
  }

  return data as AppModuleCreateInput | AppModuleUpdateInput;
}

export const createAppModule = async (req: Request, res: Response) => {
  try {
    const contentType = req.headers["content-type"] ?? "";
    const isFormData = contentType.includes("multipart/form-data");

    let data: AppModuleCreateInput;
    const imageFile = req.file;

    if (isFormData) {
      data = parseFormDataBody(req.body) as AppModuleCreateInput;
    } else {
      data = req.body as AppModuleCreateInput;
      const body = data as Record<string, unknown>;
      if (
        body.parentAppModule &&
        typeof body.parentAppModule === "object" &&
        "id" in body.parentAppModule
      ) {
        data.parentAppModuleId = (body.parentAppModule as { id: number }).id;
        delete body.parentAppModule;
      }
    }

    const created = await createAppModuleService(data, imageFile);
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
    const contentType = req.headers["content-type"] ?? "";
    const isFormData = contentType.includes("multipart/form-data");

    let data: AppModuleUpdateInput;
    const imageFile = req.file;

    if (isFormData) {
      data = parseFormDataBody(req.body) as AppModuleUpdateInput;
    } else {
      data = req.body as AppModuleUpdateInput;
      const body = data as Record<string, unknown>;
      if (
        body.parentAppModule &&
        typeof body.parentAppModule === "object" &&
        "id" in body.parentAppModule
      ) {
        data.parentAppModuleId = (body.parentAppModule as { id: number }).id;
        delete body.parentAppModule;
      }
    }

    const updated = await updateAppModuleService(id, data, imageFile);

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
