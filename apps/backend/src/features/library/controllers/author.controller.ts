import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createAuthor,
  deleteAuthor,
  findAuthorById,
  findAuthorByName,
  findAuthorsPaginated,
  updateAuthor,
} from "@/features/library/services/author.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllAuthorsController = async (
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

    const payload = await findAuthorsPaginated({
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const author = await findAuthorById(id);
    if (!author) {
      res.status(404).json(new ApiError(404, "Author not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", author, "Author fetched successfully."),
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
    const {
      legacyAuthorId,
      name,
      shortName,
      nationalityId,
      authorTypeId,
      remarks,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    const normalisedName = name.trim();
    const existing = await findAuthorByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Author already exists"));
      return;
    }

    const created = await createAuthor({
      legacyAuthorId:
        legacyAuthorId === undefined || legacyAuthorId === null
          ? null
          : Number(legacyAuthorId),
      name: normalisedName,
      shortName: shortName || null,
      nationalityId: nationalityId || null,
      authorTypeId: authorTypeId || null,
      remarks: remarks || null,
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
          "Author created successfully.",
        ),
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findAuthorById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Author not found"));
      return;
    }

    const {
      legacyAuthorId,
      name,
      shortName,
      nationalityId,
      authorTypeId,
      remarks,
    } = req.body;
    const updateData: any = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json(new ApiError(400, "Name cannot be empty"));
        return;
      }

      const normalisedName = name.trim();
      const duplicate = await findAuthorByName(normalisedName, id);
      if (duplicate) {
        res.status(409).json(new ApiError(409, "Author already exists"));
        return;
      }

      updateData.name = normalisedName;
    }

    if (legacyAuthorId !== undefined) {
      updateData.legacyAuthorId =
        legacyAuthorId === null ? null : Number(legacyAuthorId);
    }

    if (shortName !== undefined) {
      updateData.shortName = shortName || null;
    }

    if (nationalityId !== undefined) {
      updateData.nationalityId = nationalityId || null;
    }

    if (authorTypeId !== undefined) {
      updateData.authorTypeId = authorTypeId || null;
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks || null;
    }

    const updated = await updateAuthor(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Author updated successfully.",
        ),
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findAuthorById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Author not found"));
      return;
    }

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
