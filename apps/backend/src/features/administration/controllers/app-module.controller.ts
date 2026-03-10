import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAppModule,
  deleteAppModule,
  getAllAppModules,
  getAppModuleById,
  getAppModuleByName,
  updateAppModule,
} from "@/features/administration/services/app-module.service.js";

export const createAppModuleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      name,
      description,
      moduleUrl,
      image,
      parentAppModuleId,
      isMasterModule,
      isActive,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "App module name is required"));
      return;
    }

    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      res
        .status(400)
        .json(new ApiError(400, "App module description is required"));
      return;
    }

    if (!moduleUrl || typeof moduleUrl !== "string" || !moduleUrl.trim()) {
      res.status(400).json(new ApiError(400, "App module URL is required"));
      return;
    }

    const normalizedName = name.trim();
    const existing = await getAppModuleByName(normalizedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "App module name already exists"));
      return;
    }

    const createPayload = {
      name: normalizedName,
      description: description.trim(),
      moduleUrl: moduleUrl.trim(),
      image: typeof image === "string" ? image.trim() || null : null,
      parentAppModuleId:
        typeof parentAppModuleId === "number"
          ? parentAppModuleId
          : parentAppModuleId === null
            ? null
            : undefined,
      isMasterModule:
        typeof isMasterModule === "boolean" ? isMasterModule : false,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };
    const appModule = await createAppModule(createPayload);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          appModule,
          "App module created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAppModulesHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const appModules = await getAllAppModules();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          appModules,
          "App modules fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAppModuleByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const appModuleId = Number(id);

    if (!id || Number.isNaN(appModuleId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid app module ID is required"));
      return;
    }

    const appModule = await getAppModuleById(appModuleId);
    if (!appModule) {
      res.status(404).json(new ApiError(404, "App module not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          appModule,
          "App module fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAppModuleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const appModuleId = Number(id);

    if (!id || Number.isNaN(appModuleId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid app module ID is required"));
      return;
    }

    const existing = await getAppModuleById(appModuleId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "App module not found"));
      return;
    }

    const {
      name,
      description,
      moduleUrl,
      image,
      parentAppModuleId,
      isMasterModule,
      isActive,
    } = req.body;

    const updatePayload: Partial<{
      name: string;
      description: string;
      moduleUrl: string;
      image: string | null;
      parentAppModuleId: number | null;
      isMasterModule: boolean;
      isActive: boolean;
    }> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res
          .status(400)
          .json(
            new ApiError(400, "App module name must be a non-empty string"),
          );
        return;
      }
      const normalizedName = name.trim();
      if (normalizedName !== existing.name) {
        const duplicate = await getAppModuleByName(normalizedName);
        if (duplicate && duplicate.id !== appModuleId) {
          res
            .status(409)
            .json(new ApiError(409, "App module name already exists"));
          return;
        }
      }
      updatePayload.name = normalizedName;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        res
          .status(400)
          .json(
            new ApiError(
              400,
              "App module description must be a non-empty string",
            ),
          );
        return;
      }
      updatePayload.description = description.trim();
    }

    if (moduleUrl !== undefined) {
      if (typeof moduleUrl !== "string" || !moduleUrl.trim()) {
        res
          .status(400)
          .json(new ApiError(400, "App module URL must be a non-empty string"));
        return;
      }
      updatePayload.moduleUrl = moduleUrl.trim();
    }

    if (image !== undefined) {
      updatePayload.image =
        typeof image === "string" ? image.trim() || null : null;
    }

    if (parentAppModuleId !== undefined) {
      if (
        parentAppModuleId !== null &&
        (typeof parentAppModuleId !== "number" ||
          Number.isNaN(Number(parentAppModuleId)))
      ) {
        res
          .status(400)
          .json(
            new ApiError(400, "parentAppModuleId must be a number or null"),
          );
        return;
      }
      updatePayload.parentAppModuleId =
        parentAppModuleId === null ? null : Number(parentAppModuleId);
    }

    if (isMasterModule !== undefined) {
      if (typeof isMasterModule !== "boolean") {
        res
          .status(400)
          .json(new ApiError(400, "isMasterModule must be a boolean"));
        return;
      }
      updatePayload.isMasterModule = isMasterModule;
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

    const updated = await updateAppModule(appModuleId, updatePayload);

    if (!updated) {
      res.status(404).json(new ApiError(404, "App module not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "App module updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAppModuleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const appModuleId = Number(id);

    if (!id || Number.isNaN(appModuleId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid app module ID is required"));
      return;
    }

    const existing = await getAppModuleById(appModuleId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "App module not found"));
      return;
    }

    await deleteAppModule(appModuleId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "App module deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
