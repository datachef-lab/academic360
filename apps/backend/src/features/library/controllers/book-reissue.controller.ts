import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createBookReissue,
  deleteBookReissue,
  findBookReissueById,
  findBookReissuesPaginated,
  updateBookReissue,
} from "@/features/library/services/book-reissue.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllBookReissuesController = async (
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

    const payload = await findBookReissuesPaginated({
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
          "Book reissues fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getBookReissueByIdController = async (
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

    const bookReissue = await findBookReissueById(id);
    if (!bookReissue) {
      res.status(404).json(new ApiError(404, "Book reissue not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          bookReissue,
          "Book reissue fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createBookReissueController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { bookCirculationId, reissuedBy, returnTimestamp } = req.body;

    if (!reissuedBy || Number.isNaN(Number(reissuedBy))) {
      res
        .status(400)
        .json(new ApiError(400, "Valid reissuedBy (user ID) is required"));
      return;
    }

    if (!returnTimestamp) {
      res.status(400).json(new ApiError(400, "returnTimestamp is required"));
      return;
    }

    const created = await createBookReissue({
      bookCirculationId:
        bookCirculationId === undefined || bookCirculationId === null
          ? null
          : Number(bookCirculationId),
      reissuedBy: Number(reissuedBy),
      returnTimestamp: new Date(returnTimestamp),
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
          "Book reissue created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateBookReissueController = async (
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

    const existing = await findBookReissueById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Book reissue not found"));
      return;
    }

    const { bookCirculationId, reissuedBy, returnTimestamp } = req.body;
    const updateData: any = { updatedAt: new Date() };

    if (bookCirculationId !== undefined) {
      updateData.bookCirculationId =
        bookCirculationId === null ? null : Number(bookCirculationId);
    }

    if (reissuedBy !== undefined) {
      if (Number.isNaN(Number(reissuedBy))) {
        res
          .status(400)
          .json(new ApiError(400, "Valid reissuedBy (user ID) is required"));
        return;
      }
      updateData.reissuedBy = Number(reissuedBy);
    }

    if (returnTimestamp !== undefined) {
      updateData.returnTimestamp = new Date(returnTimestamp);
    }

    const updated = await updateBookReissue(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Book reissue updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteBookReissueController = async (
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

    const existing = await findBookReissueById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Book reissue not found"));
      return;
    }

    await deleteBookReissue(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Book reissue deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
