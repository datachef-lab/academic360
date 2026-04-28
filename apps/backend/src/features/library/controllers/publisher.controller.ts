import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createPublisher,
  deletePublisher,
  findPublisherById,
  findPublisherByName,
  findPublishersPaginated,
  updatePublisher,
} from "@/features/library/services/publisher.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllPublishersController = async (
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

    const payload = await findPublishersPaginated({
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
          "Publishers fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getPublisherByIdController = async (
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

    const publisher = await findPublisherById(id);
    if (!publisher) {
      res.status(404).json(new ApiError(404, "Publisher not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          publisher,
          "Publisher fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createPublisherController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { legacyPublisherId, name, code } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    const normalisedName = name.trim();
    const existing = await findPublisherByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Publisher already exists"));
      return;
    }

    const created = await createPublisher({
      legacyPublisherId:
        legacyPublisherId === undefined || legacyPublisherId === null
          ? null
          : Number(legacyPublisherId),
      name: normalisedName,
      code:
        code === undefined || code === null
          ? null
          : typeof code === "string"
            ? code.trim()
            : String(code),
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
          "Publisher created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePublisherController = async (
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

    const existing = await findPublisherById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Publisher not found"));
      return;
    }

    const { legacyPublisherId, name, code } = req.body;
    const updateData: {
      legacyPublisherId?: number | null;
      name?: string;
      code?: string | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json(new ApiError(400, "Name cannot be empty"));
        return;
      }

      const normalisedName = name.trim();
      const duplicate = await findPublisherByName(normalisedName, id);
      if (duplicate) {
        res.status(409).json(new ApiError(409, "Publisher already exists"));
        return;
      }

      updateData.name = normalisedName;
    }

    if (legacyPublisherId !== undefined) {
      updateData.legacyPublisherId =
        legacyPublisherId === null ? null : Number(legacyPublisherId);
    }

    if (code !== undefined) {
      updateData.code =
        code === null
          ? null
          : typeof code === "string"
            ? code.trim()
            : String(code);
    }

    const updated = await updatePublisher(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Publisher updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deletePublisherController = async (
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

    const existing = await findPublisherById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Publisher not found"));
      return;
    }

    const deleted = await deletePublisher(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Publisher deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
