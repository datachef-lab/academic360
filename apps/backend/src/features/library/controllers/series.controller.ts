import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createSeries,
  deleteSeries,
  findSeriesById,
  findSeriesByName,
  findSeriesPaginated,
  updateSeries,
} from "@/features/library/services/series.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllSeriesController = async (
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

    const payload = await findSeriesPaginated({
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
          "Series fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getSeriesByIdController = async (
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

    const series = await findSeriesById(id);
    if (!series) {
      res.status(404).json(new ApiError(404, "Series not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", series, "Series fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createSeriesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { legacySeriesId, name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    const normalisedName = name.trim();
    const existing = await findSeriesByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Series already exists"));
      return;
    }

    const created = await createSeries({
      legacySeriesId:
        legacySeriesId === undefined || legacySeriesId === null
          ? null
          : Number(legacySeriesId),
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
          "Series created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateSeriesController = async (
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

    const existing = await findSeriesById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Series not found"));
      return;
    }

    const { legacySeriesId, name } = req.body;
    const updateData: {
      legacySeriesId?: number | null;
      name?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json(new ApiError(400, "Name cannot be empty"));
        return;
      }

      const normalisedName = name.trim();
      const duplicate = await findSeriesByName(normalisedName, id);
      if (duplicate) {
        res.status(409).json(new ApiError(409, "Series already exists"));
        return;
      }

      updateData.name = normalisedName;
    }

    if (legacySeriesId !== undefined) {
      updateData.legacySeriesId =
        legacySeriesId === null ? null : Number(legacySeriesId);
    }

    const updated = await updateSeries(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Series updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteSeriesController = async (
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

    const existing = await findSeriesById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Series not found"));
      return;
    }

    const deleted = await deleteSeries(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Series deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
