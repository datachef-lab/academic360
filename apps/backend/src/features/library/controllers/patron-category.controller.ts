import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createPatronCategory,
  deletePatronCategory,
  findPatronCategoriesPaginated,
  getPatronCategoryById,
  updatePatronCategory,
  type PatronCategoryUpsertInput,
} from "@/features/library/services/patron-category.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const bodyToUpsert = (
  body: Record<string, unknown>,
): PatronCategoryUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
  code: typeof body.code === "string" ? body.code : null,
  description: typeof body.description === "string" ? body.description : null,
  isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
});

export const getPatronCategoryListController = async (
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
    const result = await findPatronCategoriesPaginated({
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
          "Patron categories fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getPatronCategoryByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid patron category id.");
    const row = await getPatronCategoryById(id);
    if (!row) throw new ApiError(404, "Patron category not found.");
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Patron category fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createPatronCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    const id = await createPatronCategory(input);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          { id },
          "Patron category created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePatronCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid patron category id.");
    const existing = await getPatronCategoryById(id);
    if (!existing) throw new ApiError(404, "Patron category not found.");
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    await updatePatronCategory(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Patron category updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deletePatronCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid patron category id.");
    const existing = await getPatronCategoryById(id);
    if (!existing) throw new ApiError(404, "Patron category not found.");
    await deletePatronCategory(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Patron category deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
