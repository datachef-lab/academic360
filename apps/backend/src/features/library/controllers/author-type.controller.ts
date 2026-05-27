import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createAuthorType,
  deleteAuthorType,
  findAuthorTypeById,
  findAuthorTypeByName,
  findAuthorTypesPaginated,
  updateAuthorType,
} from "@/features/library/services/author-type.service.js";

const parseId = (value?: string | string[]) => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
};

export const createAuthorTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { legacyAuthorTypeId, name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    const normalisedName = name.trim();

    const existing = await findAuthorTypeByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Author type already exists"));
      return;
    }

    if (
      legacyAuthorTypeId !== undefined &&
      Number.isNaN(Number(legacyAuthorTypeId))
    ) {
      res
        .status(400)
        .json(new ApiError(400, "legacyAuthorTypeId must be a number"));
      return;
    }

    const created = await createAuthorType({
      legacyAuthorTypeId:
        legacyAuthorTypeId === undefined || legacyAuthorTypeId === null
          ? null
          : Number(legacyAuthorTypeId),
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
          "Author type created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllAuthorTypesController = async (
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

    const payload = await findAuthorTypesPaginated({
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
          "Author types fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAuthorTypeByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // TODO: Implement getAuthorTypeByIdController logic
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Invalid author type ID"));
      return;
    }

    const authorType = await findAuthorTypeById(id);
    if (!authorType) {
      res.status(404).json(new ApiError(404, "Author type not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          authorType,
          "Author type fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAuthorTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Invalid author type ID"));
      return;
    }

    const existing = await findAuthorTypeById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Author type not found"));
      return;
    }

    const { legacyAuthorTypeId, name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    const normalisedName = name.trim();

    const duplicate = await findAuthorTypeByName(normalisedName);
    if (duplicate && duplicate.id !== id) {
      res
        .status(409)
        .json(new ApiError(409, "Author type with this name already exists"));
      return;
    }

    if (
      legacyAuthorTypeId !== undefined &&
      Number.isNaN(Number(legacyAuthorTypeId))
    ) {
      res
        .status(400)
        .json(new ApiError(400, "legacyAuthorTypeId must be a number"));
      return;
    }

    const updated = await updateAuthorType(id, {
      legacyAuthorTypeId:
        legacyAuthorTypeId === undefined || legacyAuthorTypeId === null
          ? null
          : Number(legacyAuthorTypeId),
      name: normalisedName,
      updatedAt: new Date(),
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Author type updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAuthorTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Invalid author type ID"));
      return;
    }
    const existing = await findAuthorTypeById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Author type not found"));
      return;
    }
    const deleted = await deleteAuthorType(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Author type deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
