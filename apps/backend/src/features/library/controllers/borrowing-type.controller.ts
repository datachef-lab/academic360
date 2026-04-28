import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createBorrowingType,
  deleteBorrowingType,
  findBorrowingTypeById,
  findBorrowingTypeByName,
  findBorrowingTypesPaginated,
  updateBorrowingType,
} from "@/features/library/services/borrowing-type.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllBorrowingTypesController = async (
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

    const payload = await findBorrowingTypesPaginated({
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
          "Borrowing types fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getBorrowingTypeByIdController = async (
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

    const borrowingType = await findBorrowingTypeById(id);
    if (!borrowingType) {
      res.status(404).json(new ApiError(404, "Borrowing type not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          borrowingType,
          "Borrowing type fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createBorrowingTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { legacyBorrowingTypeId, name, searchGuideline } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    const normalisedName = name.trim();
    const existing = await findBorrowingTypeByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Borrowing type already exists"));
      return;
    }

    const created = await createBorrowingType({
      legacyBorrowingTypeId:
        legacyBorrowingTypeId === undefined || legacyBorrowingTypeId === null
          ? null
          : Number(legacyBorrowingTypeId),
      name: normalisedName,
      searchGuideline:
        searchGuideline === undefined ? false : Boolean(searchGuideline),
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
          "Borrowing type created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateBorrowingTypeController = async (
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

    const existing = await findBorrowingTypeById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Borrowing type not found"));
      return;
    }

    const { legacyBorrowingTypeId, name, searchGuideline } = req.body;
    const updateData: {
      legacyBorrowingTypeId?: number | null;
      name?: string;
      searchGuideline?: boolean;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json(new ApiError(400, "Name cannot be empty"));
        return;
      }

      const normalisedName = name.trim();
      const duplicate = await findBorrowingTypeByName(normalisedName, id);
      if (duplicate) {
        res
          .status(409)
          .json(new ApiError(409, "Borrowing type already exists"));
        return;
      }

      updateData.name = normalisedName;
    }

    if (legacyBorrowingTypeId !== undefined) {
      updateData.legacyBorrowingTypeId =
        legacyBorrowingTypeId === null ? null : Number(legacyBorrowingTypeId);
    }

    if (searchGuideline !== undefined) {
      updateData.searchGuideline = Boolean(searchGuideline);
    }

    const updated = await updateBorrowingType(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Borrowing type updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteBorrowingTypeController = async (
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

    const existing = await findBorrowingTypeById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Borrowing type not found"));
      return;
    }

    const deleted = await deleteBorrowingType(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Borrowing type deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
