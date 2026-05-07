import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createStatus,
  deleteStatus,
  findStatusesPaginated,
  getStatusById,
  updateStatus,
  type StatusUpsertInput,
} from "@/features/library/services/status.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const parseOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return undefined;
};

const bodyToUpsert = (body: Record<string, unknown>): StatusUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
  isIssuable: parseOptionalBoolean(body.isIssuable),
  issuedTo: typeof body.issuedTo === "string" ? body.issuedTo : null,
});

export const getStatusListController = async (
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

    const result = await findStatusesPaginated({
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
          "Statuses fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getStatusByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid status id.");
    }

    const row = await getStatusById(id);
    if (!row) {
      throw new ApiError(404, "Status not found.");
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Status fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) {
      throw new ApiError(400, "Name is required.");
    }

    const id = await createStatus(input);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", { id }, "Status created successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid status id.");
    }

    const existing = await getStatusById(id);
    if (!existing) {
      throw new ApiError(404, "Status not found.");
    }

    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) {
      throw new ApiError(400, "Name is required.");
    }

    await updateStatus(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Status updated successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid status id.");
    }

    const existing = await getStatusById(id);
    if (!existing) {
      throw new ApiError(404, "Status not found.");
    }

    await deleteStatus(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Status deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
