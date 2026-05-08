import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createEnclosure,
  deleteEnclosure,
  findEnclosureById,
  findEnclosureByName,
  findEnclosuresPaginated,
  updateEnclosure,
} from "@/features/library/services/enclosure.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllEnclosuresController = async (
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

    const payload = await findEnclosuresPaginated({
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
          "Enclosures fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getEnclosureByIdController = async (
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

    const enclosure = await findEnclosureById(id);
    if (!enclosure) {
      res.status(404).json(new ApiError(404, "Enclosure not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          enclosure,
          "Enclosure fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createEnclosureController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { legacyEnclosureId, name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    const normalisedName = name.trim();
    const existing = await findEnclosureByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Enclosure already exists"));
      return;
    }

    const created = await createEnclosure({
      legacyEnclosureId:
        legacyEnclosureId === undefined || legacyEnclosureId === null
          ? null
          : Number(legacyEnclosureId),
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
          "Enclosure created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateEnclosureController = async (
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

    const existing = await findEnclosureById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Enclosure not found"));
      return;
    }

    const { legacyEnclosureId, name } = req.body;
    const updateData: {
      legacyEnclosureId?: number | null;
      name?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json(new ApiError(400, "Name cannot be empty"));
        return;
      }

      const normalisedName = name.trim();
      const duplicate = await findEnclosureByName(normalisedName, id);
      if (duplicate) {
        res.status(409).json(new ApiError(409, "Enclosure already exists"));
        return;
      }

      updateData.name = normalisedName;
    }

    if (legacyEnclosureId !== undefined) {
      updateData.legacyEnclosureId =
        legacyEnclosureId === null ? null : Number(legacyEnclosureId);
    }

    const updated = await updateEnclosure(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Enclosure updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteEnclosureController = async (
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

    const existing = await findEnclosureById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Enclosure not found"));
      return;
    }

    const deleted = await deleteEnclosure(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Enclosure deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
