import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  findAllAppModules,
  findAppModuleById,
  createAppModule as createAppModuleService,
  updateAppModule as updateAppModuleService,
  deleteAppModule as deleteAppModuleService,
  findAppModuleByName,
  findAppModuleByUrl,
} from "@/features/administration/services/appModule.service.js";

export const createAppModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      name,
      description,
      iconType,
      iconValue,
      moduleUrl,
      image,
      isMasterModule,
      isReadOnly,
      parentAppModuleId,
    } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    if (!moduleUrl || typeof moduleUrl !== "string") {
      res.status(400).json(new ApiError(400, "moduleUrl is required"));
      return;
    }

    const existingName = await findAppModuleByName(name);
    if (existingName) {
      res.status(409).json(new ApiError(409, "App module name already exists"));
      return;
    }

    const existingUrl = await findAppModuleByUrl(moduleUrl);
    if (existingUrl) {
      res.status(409).json(new ApiError(409, "App module url already exists"));
      return;
    }

    const data = {
      name,
      description: description || "",
      iconType: iconType || null,
      iconValue: iconValue || null,
      moduleUrl,
      image: image || null,
      isMasterModule: Boolean(isMasterModule) || false,
      isReadOnly: Boolean(isReadOnly) || false,
      parentAppModuleId: parentAppModuleId ? Number(parentAppModuleId) : null,
      isActive: true,
    };

    const created = await createAppModuleService(data as any);

    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", created, "App module created"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllAppModules = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rows = await findAllAppModules();
    res.status(200).json(new ApiResponse(200, "SUCCESS", rows, "OK"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAppModuleById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const found = await findAppModuleById(Number(id));
    if (!found) {
      res.status(404).json(new ApiError(404, "App module not found"));
      return;
    }

    res.status(200).json(new ApiResponse(200, "SUCCESS", found, "OK"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAppModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      iconType,
      iconValue,
      moduleUrl,
      image,
      isMasterModule,
      isReadOnly,
      isActive,
      parentAppModuleId,
    } = req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findAppModuleById(Number(id));
    if (!existing) {
      res.status(404).json(new ApiError(404, "App module not found"));
      return;
    }

    if (name && name !== existing.name) {
      const dup = await findAppModuleByName(name);
      if (dup) {
        res
          .status(409)
          .json(new ApiError(409, "App module name already exists"));
        return;
      }
    }

    if (moduleUrl && moduleUrl !== existing.moduleUrl) {
      const dup = await findAppModuleByUrl(moduleUrl);
      if (dup) {
        res
          .status(409)
          .json(new ApiError(409, "App module url already exists"));
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (iconType !== undefined) updateData.iconType = iconType;
    if (iconValue !== undefined) updateData.iconValue = iconValue;
    if (moduleUrl !== undefined) updateData.moduleUrl = moduleUrl;
    if (image !== undefined) updateData.image = image;
    if (isMasterModule !== undefined)
      updateData.isMasterModule = Boolean(isMasterModule);
    if (isReadOnly !== undefined) updateData.isReadOnly = Boolean(isReadOnly);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (parentAppModuleId !== undefined)
      updateData.parentAppModuleId = parentAppModuleId
        ? Number(parentAppModuleId)
        : null;

    const updated = await updateAppModuleService(Number(id), updateData);

    if (!updated) {
      res.status(404).json(new ApiError(404, "App module not found"));
      return;
    }

    res.status(200).json(new ApiResponse(200, "SUCCESS", updated, "OK"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAppModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findAppModuleById(Number(id));
    if (!existing) {
      res.status(404).json(new ApiError(404, "App module not found"));
      return;
    }

    const deleted = await deleteAppModuleService(Number(id));

    res.status(200).json(new ApiResponse(200, "SUCCESS", deleted, "Deleted"));
  } catch (error) {
    handleError(error, res, next);
  }
};
