import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createShelf,
  deleteShelf,
  findShelvesPaginated,
  getShelfById,
  updateShelf,
  type ShelfUpsertInput,
} from "@/features/library/services/shelf.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const bodyToUpsert = (body: Record<string, unknown>): ShelfUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
});

export const getShelfListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit =
      Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 100);
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await findShelvesPaginated({
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
          result,
          "Shelves fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getShelfByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid shelf id.");
    }

    const row = await getShelfById(id);
    if (!row) {
      throw new ApiError(404, "Shelf not found.");
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Shelf fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createShelfController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) {
      throw new ApiError(400, "Name is required.");
    }

    const id = await createShelf(input);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", { id }, "Shelf created successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateShelfController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid shelf id.");
    }

    const existing = await getShelfById(id);
    if (!existing) {
      throw new ApiError(404, "Shelf not found.");
    }

    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) {
      throw new ApiError(400, "Name is required.");
    }

    await updateShelf(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Shelf updated successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteShelfController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid shelf id.");
    }

    const existing = await getShelfById(id);
    if (!existing) {
      throw new ApiError(404, "Shelf not found.");
    }

    await deleteShelf(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Shelf deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
