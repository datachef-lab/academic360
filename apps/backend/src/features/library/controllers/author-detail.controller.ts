import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createAuthorDetail,
  deleteAuthorDetail,
  findAuthorDetailById,
  findAuthorDetailsPaginated,
  updateAuthorDetail,
} from "@/features/library/services/author-detail.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllAuthorDetailsController = async (
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

    const payload = await findAuthorDetailsPaginated({
      page: safePage,
      limit: safeLimit,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          payload,
          "Author details fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAuthorDetailByIdController = async (
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

    const authorDetail = await findAuthorDetailById(id);
    if (!authorDetail) {
      res.status(404).json(new ApiError(404, "Author detail not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          authorDetail,
          "Author detail fetched successfully.",
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
    const { legacyAuthorDetailsId, bookId, authorTypeId, authorId, remarks } =
      req.body;

    if (!bookId || Number.isNaN(Number(bookId))) {
      res.status(400).json(new ApiError(400, "Valid bookId is required"));
      return;
    }

    if (!authorTypeId || Number.isNaN(Number(authorTypeId))) {
      res.status(400).json(new ApiError(400, "Valid authorTypeId is required"));
      return;
    }

    if (!authorId || Number.isNaN(Number(authorId))) {
      res.status(400).json(new ApiError(400, "Valid authorId is required"));
      return;
    }

    const created = await createAuthorDetail({
      legacyAuthorDetailsId:
        legacyAuthorDetailsId === undefined || legacyAuthorDetailsId === null
          ? null
          : Number(legacyAuthorDetailsId),
      bookId: Number(bookId),
      authorTypeId: Number(authorTypeId),
      authorId: Number(authorId),
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
          "Author detail created successfully.",
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findAuthorDetailById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Author detail not found"));
      return;
    }

    const { legacyAuthorDetailsId, bookId, authorTypeId, authorId, remarks } =
      req.body;
    const updateData: any = { updatedAt: new Date() };

    if (legacyAuthorDetailsId !== undefined) {
      updateData.legacyAuthorDetailsId =
        legacyAuthorDetailsId === null ? null : Number(legacyAuthorDetailsId);
    }

    if (bookId !== undefined) {
      if (Number.isNaN(Number(bookId))) {
        res.status(400).json(new ApiError(400, "Valid bookId is required"));
        return;
      }
      updateData.bookId = Number(bookId);
    }

    if (authorTypeId !== undefined) {
      if (Number.isNaN(Number(authorTypeId))) {
        res
          .status(400)
          .json(new ApiError(400, "Valid authorTypeId is required"));
        return;
      }
      updateData.authorTypeId = Number(authorTypeId);
    }

    if (authorId !== undefined) {
      if (Number.isNaN(Number(authorId))) {
        res.status(400).json(new ApiError(400, "Valid authorId is required"));
        return;
      }
      updateData.authorId = Number(authorId);
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks || null;
    }

    const updated = await updateAuthorDetail(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Author detail updated successfully.",
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findAuthorDetailById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Author detail not found"));
      return;
    }

    await deleteAuthorDetail(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Author detail deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
