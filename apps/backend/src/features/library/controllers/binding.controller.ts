import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createBinding,
  deleteBinding,
  findBindingById,
  findBindingByName,
  findBindingsPaginated,
  updateBinding,
} from "@/features/library/services/binding.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllBindingsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit =
      Number.isNaN(limit) || limit < 1 ? 10 : Math.min(limit, 100);
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const payload = await findBindingsPaginated({
      page: safePage,
      limit: safeLimit,
      search,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          payload,
          "Binding types fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getBindingByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const binding = await findBindingById(id);
    if (!binding) {
      res.status(404).json(new ApiError(404, "Binding type not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          binding,
          "Binding type fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createBindingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { legacyBindingId, name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    const normalisedName = name.trim();
    const existing = await findBindingByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Binding type already exists"));
      return;
    }

    const created = await createBinding({
      legacyBindingId:
        legacyBindingId === undefined || legacyBindingId === null
          ? null
          : Number(legacyBindingId),
      name: normalisedName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Binding type created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateBindingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findBindingById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Binding type not found"));
      return;
    }

    const { legacyBindingId, name } = req.body;
    const updateData: {
      legacyBindingId?: number | null;
      name?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json(new ApiError(400, "Name cannot be empty"));
        return;
      }

      const normalisedName = name.trim();
      const duplicate = await findBindingByName(normalisedName, id);
      if (duplicate) {
        res.status(409).json(new ApiError(409, "Binding type already exists"));
        return;
      }

      updateData.name = normalisedName;
    }

    if (legacyBindingId !== undefined) {
      updateData.legacyBindingId =
        legacyBindingId === null ? null : Number(legacyBindingId);
    }

    const updated = await updateBinding(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Binding type updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteBindingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findBindingById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Binding type not found"));
      return;
    }

    const deleted = await deleteBinding(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Binding type deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
