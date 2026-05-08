import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createLibraryPeriod,
  deleteLibraryPeriod,
  findLibraryPeriodById,
  findLibraryPeriodByName,
  findLibraryPeriodsPaginated,
  updateLibraryPeriod,
} from "@/features/library/services/library-period.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllLibraryPeriodsController = async (
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

    const payload = await findLibraryPeriodsPaginated({
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
          "Library periods fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getLibraryPeriodByIdController = async (
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

    const period = await findLibraryPeriodById(id);
    if (!period) {
      res.status(404).json(new ApiError(404, "Library period not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          period,
          "Library period fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createLibraryPeriodController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { legacyLibraryPeriodId, name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    const normalisedName = name.trim();
    const existing = await findLibraryPeriodByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Library period already exists"));
      return;
    }

    const created = await createLibraryPeriod({
      legacyLibraryPeriodId:
        legacyLibraryPeriodId === undefined || legacyLibraryPeriodId === null
          ? null
          : Number(legacyLibraryPeriodId),
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
          "Library period created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateLibraryPeriodController = async (
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

    const existing = await findLibraryPeriodById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Library period not found"));
      return;
    }

    const { legacyLibraryPeriodId, name } = req.body;
    const updateData: {
      legacyLibraryPeriodId?: number | null;
      name?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json(new ApiError(400, "Name cannot be empty"));
        return;
      }

      const normalisedName = name.trim();
      const duplicate = await findLibraryPeriodByName(normalisedName, id);
      if (duplicate) {
        res
          .status(409)
          .json(new ApiError(409, "Library period already exists"));
        return;
      }

      updateData.name = normalisedName;
    }

    if (legacyLibraryPeriodId !== undefined) {
      updateData.legacyLibraryPeriodId =
        legacyLibraryPeriodId === null ? null : Number(legacyLibraryPeriodId);
    }

    const updated = await updateLibraryPeriod(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Library period updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteLibraryPeriodController = async (
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

    const existing = await findLibraryPeriodById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Library period not found"));
      return;
    }

    const deleted = await deleteLibraryPeriod(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Library period deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
