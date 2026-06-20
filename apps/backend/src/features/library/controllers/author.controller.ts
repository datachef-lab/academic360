import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAuthor,
  deleteAuthor,
  findAuthorsPaginated,
  getAuthorById,
  updateAuthor,
  type AuthorUpsertInput,
} from "@/features/library/services/author.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const parseOptionalId = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const bodyToUpsert = (body: Record<string, unknown>): AuthorUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
  shortName: typeof body.shortName === "string" ? body.shortName : null,
  authorTypeId: parseOptionalId(body.authorTypeId),
  nationalityId: parseOptionalId(body.nationalityId),
  remarks: typeof body.remarks === "string" ? body.remarks : null,
});

export const getAuthorListController = async (
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
    const authorTypeId = parseOptionalId(req.query.authorTypeId) ?? undefined;
    const nationalityId = parseOptionalId(req.query.nationalityId) ?? undefined;

    const result = await findAuthorsPaginated({
      page: safePage,
      limit: safeLimit,
      search,
      authorTypeId,
      nationalityId,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Authors fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAuthorByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid author id.");
    const row = await getAuthorById(id);
    if (!row) throw new ApiError(404, "Author not found.");
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Author fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createAuthorController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    const id = await createAuthor(input);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", { id }, "Author created successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAuthorController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid author id.");
    const existing = await getAuthorById(id);
    if (!existing) throw new ApiError(404, "Author not found.");
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    await updateAuthor(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Author updated successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAuthorController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid author id.");
    const existing = await getAuthorById(id);
    if (!existing) throw new ApiError(404, "Author not found.");
    await deleteAuthor(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Author deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
