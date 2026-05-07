import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createRack,
  deleteRack,
  findRacksPaginated,
  getRackById,
  updateRack,
  type RackUpsertInput,
} from "@/features/library/services/rack.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const bodyToUpsert = (body: Record<string, unknown>): RackUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
});

export const getRackListController = async (
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

    const result = await findRacksPaginated({
      page: safePage,
      limit: safeLimit,
      search,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Racks fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getRackByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid rack id.");
    }

    const row = await getRackById(id);
    if (!row) {
      throw new ApiError(404, "Rack not found.");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Rack fetched successfully."));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createRackController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) {
      throw new ApiError(400, "Name is required.");
    }

    const id = await createRack(input);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", { id }, "Rack created successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateRackController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid rack id.");
    }

    const existing = await getRackById(id);
    if (!existing) {
      throw new ApiError(404, "Rack not found.");
    }

    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) {
      throw new ApiError(400, "Name is required.");
    }

    await updateRack(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Rack updated successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteRackController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid rack id.");
    }

    const existing = await getRackById(id);
    if (!existing) {
      throw new ApiError(404, "Rack not found.");
    }

    await deleteRack(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Rack deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
