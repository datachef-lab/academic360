import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createLibraryDocumentType,
  deleteLibraryDocumentType,
  findLibraryDocumentTypesPaginated,
  getLibraryDocumentTypeById,
  updateLibraryDocumentType,
  type LibraryDocumentTypeUpsertInput,
} from "@/features/library/services/library-document-type.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const parseOptionalInt = (value: unknown): number | null => {
  if (value === "" || value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const parseQueryInt = (
  q: Request["query"],
  key: string,
): number | undefined => {
  const raw = q[key];
  const s =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  if (s === undefined || s === "") return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
};

const bodyToUpsert = (
  body: Record<string, unknown>,
): LibraryDocumentTypeUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
  libraryArticleId: parseOptionalInt(body.libraryArticleId),
});

export const getLibraryDocumentTypeListController = async (
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

    const result = await findLibraryDocumentTypesPaginated({
      page: safePage,
      limit: safeLimit,
      search,
      libraryArticleId: parseQueryInt(req.query, "libraryArticleId"),
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Library document types fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getLibraryDocumentTypeByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid library document type id.");
    }
    const row = await getLibraryDocumentTypeById(id);
    if (!row) {
      throw new ApiError(404, "Library document type not found.");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Library document type fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createLibraryDocumentTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) {
      throw new ApiError(400, "Name is required.");
    }

    const id = await createLibraryDocumentType(input);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          { id },
          "Library document type created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateLibraryDocumentTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid library document type id.");
    }

    const existing = await getLibraryDocumentTypeById(id);
    if (!existing) {
      throw new ApiError(404, "Library document type not found.");
    }

    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) {
      throw new ApiError(400, "Name is required.");
    }

    await updateLibraryDocumentType(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Library document type updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteLibraryDocumentTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid library document type id.");
    }

    const existing = await getLibraryDocumentTypeById(id);
    if (!existing) {
      throw new ApiError(404, "Library document type not found.");
    }

    await deleteLibraryDocumentType(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Library document type deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
