import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createEntryMode,
  deleteEntryMode,
  findEntryModeById,
  findEntryModeByName,
  findEntryModesPaginated,
  updateEntryMode,
} from "@/features/library/services/entry-mode.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllEntryModesController = async (
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

    const payload = await findEntryModesPaginated({
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
          "Entry modes fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getEntryModeByIdController = async (
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

    const entryMode = await findEntryModeById(id);
    if (!entryMode) {
      res.status(404).json(new ApiError(404, "Entry mode not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          entryMode,
          "Entry mode fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createEntryModeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { legacyEntryModeId, name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    const normalisedName = name.trim();
    const existing = await findEntryModeByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Entry mode already exists"));
      return;
    }

    const created = await createEntryMode({
      legacyEntryModeId:
        legacyEntryModeId === undefined || legacyEntryModeId === null
          ? null
          : Number(legacyEntryModeId),
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
          "Entry mode created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateEntryModeController = async (
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

    const existing = await findEntryModeById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Entry mode not found"));
      return;
    }

    const { legacyEntryModeId, name } = req.body;
    const updateData: {
      legacyEntryModeId?: number | null;
      name?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json(new ApiError(400, "Name cannot be empty"));
        return;
      }

      const normalisedName = name.trim();
      const duplicate = await findEntryModeByName(normalisedName, id);
      if (duplicate) {
        res.status(409).json(new ApiError(409, "Entry mode already exists"));
        return;
      }

      updateData.name = normalisedName;
    }

    if (legacyEntryModeId !== undefined) {
      updateData.legacyEntryModeId =
        legacyEntryModeId === null ? null : Number(legacyEntryModeId);
    }

    const updated = await updateEntryMode(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Entry mode updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteEntryModeController = async (
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

    const existing = await findEntryModeById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Entry mode not found"));
      return;
    }

    const deleted = await deleteEntryMode(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Entry mode deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
