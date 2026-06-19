import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAuthorType,
  deleteAuthorType,
  findAuthorTypesPaginated,
  getAuthorTypeById,
  updateAuthorType,
  type AuthorTypeUpsertInput,
} from "@/features/library/services/author-type.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const bodyToUpsert = (
  body: Record<string, unknown>,
): AuthorTypeUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
});

export const getAuthorTypeListController = async (
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

    const result = await findAuthorTypesPaginated({
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
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid author type id.");
    const row = await getAuthorTypeById(id);
    if (!row) throw new ApiError(404, "Author type not found.");
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Author type fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createAuthorTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    const id = await createAuthorType(input);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          { id },
          "Author type created successfully.",
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
    if (!id) throw new ApiError(400, "Invalid author type id.");
    const existing = await getAuthorTypeById(id);
    if (!existing) throw new ApiError(404, "Author type not found.");
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    await updateAuthorType(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
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
    if (!id) throw new ApiError(400, "Invalid author type id.");
    const existing = await getAuthorTypeById(id);
    if (!existing) throw new ApiError(404, "Author type not found.");
    await deleteAuthorType(id);
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
