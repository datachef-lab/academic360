import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAuthorDetail,
  deleteAuthorDetail,
  findAuthorDetailsByBookId,
  getAuthorDetailById,
  replaceBookAuthors,
  updateAuthorDetail,
  type AuthorDetailUpsertInput,
} from "@/features/library/services/author-detail.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const parseRequiredId = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const bodyToUpsert = (
  body: Record<string, unknown>,
  bookIdFallback?: number,
): AuthorDetailUpsertInput => ({
  bookId: parseRequiredId(body.bookId) ?? bookIdFallback ?? 0,
  authorId: parseRequiredId(body.authorId) ?? 0,
  authorTypeId: parseRequiredId(body.authorTypeId) ?? 0,
  remarks: typeof body.remarks === "string" ? body.remarks : null,
});

const validate = (input: AuthorDetailUpsertInput) => {
  if (!input.bookId) throw new ApiError(400, "bookId is required.");
  if (!input.authorId) throw new ApiError(400, "authorId is required.");
  if (!input.authorTypeId) throw new ApiError(400, "authorTypeId is required.");
};

export const getAuthorDetailsByBookIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const bookId = parseId(req.params.bookId);
    if (!bookId) throw new ApiError(400, "Invalid book id.");
    const rows = await findAuthorDetailsByBookId(bookId);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Book authors fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createAuthorDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const bookId = parseId(req.params.bookId) ?? undefined;
    const input = bodyToUpsert(req.body as Record<string, unknown>, bookId);
    validate(input);
    const id = await createAuthorDetail(input);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          { id },
          "Book author added successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAuthorDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const existing = await getAuthorDetailById(id);
    if (!existing) throw new ApiError(404, "Author detail not found.");
    const input = bodyToUpsert(
      req.body as Record<string, unknown>,
      existing.bookId,
    );
    validate(input);
    await updateAuthorDetail(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Book author updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAuthorDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const existing = await getAuthorDetailById(id);
    if (!existing) throw new ApiError(404, "Author detail not found.");
    await deleteAuthorDetail(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Book author removed successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const replaceBookAuthorsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const bookId = parseId(req.params.bookId);
    if (!bookId) throw new ApiError(400, "Invalid book id.");
    const body = req.body as { authors?: Array<Record<string, unknown>> };
    const rows = Array.isArray(body.authors) ? body.authors : [];
    const normalized = rows.map((raw) => {
      const authorId = parseRequiredId(raw.authorId);
      const authorTypeId = parseRequiredId(raw.authorTypeId);
      if (!authorId || !authorTypeId) {
        throw new ApiError(
          400,
          "Each author row must include authorId and authorTypeId.",
        );
      }
      return {
        authorId,
        authorTypeId,
        remarks: typeof raw.remarks === "string" ? raw.remarks : null,
      };
    });
    await replaceBookAuthors(bookId, normalized);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Book authors saved successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
