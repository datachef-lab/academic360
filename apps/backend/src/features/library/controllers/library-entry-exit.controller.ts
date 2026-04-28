import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createLibraryEntryExit,
  deleteLibraryEntryExit,
  findLibraryEntryExitById,
  findLibraryEntryExitPaginated,
  searchLibraryUsers,
  updateLibraryEntryExit,
} from "@/features/library/services/library-entry-exit.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllLibraryEntryExitController = async (
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
    const userType =
      typeof req.query.userType === "string" ? req.query.userType : undefined;
    const currentStatus =
      typeof req.query.currentStatus === "string"
        ? req.query.currentStatus
        : undefined;
    const date =
      typeof req.query.date === "string" ? req.query.date : undefined;

    const records = await findLibraryEntryExitPaginated({
      page: safePage,
      limit: safeLimit,
      search,
      userType: userType as
        | "ADMIN"
        | "STUDENT"
        | "FACULTY"
        | "STAFF"
        | "PARENTS"
        | undefined,
      currentStatus: currentStatus as "CHECKED_IN" | "CHECKED_OUT" | undefined,
      date,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          records,
          "Library entry/exit fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getLibraryEntryExitByIdController = async (
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

    const record = await findLibraryEntryExitById(id);
    if (!record) {
      res
        .status(404)
        .json(new ApiError(404, "Library entry/exit record not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          record,
          "Library entry/exit fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const searchLibraryUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit =
      Number.isNaN(limit) || limit < 1 ? 10 : Math.min(limit, 50);

    const payload = await searchLibraryUsers(search, safePage, safeLimit);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          payload,
          "Library users fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createLibraryEntryExitController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId, currentStatus } = req.body;

    if (!userId || Number.isNaN(Number(userId))) {
      res.status(400).json(new ApiError(400, "Valid userId is required"));
      return;
    }

    const created = await createLibraryEntryExit({
      userId: Number(userId),
      currentStatus: currentStatus ?? "CHECKED_IN",
      entryTimestamp: new Date(),
      exitTimestamp: null,
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Library entry/exit created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateLibraryEntryExitController = async (
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

    const existing = await findLibraryEntryExitById(id);
    if (!existing) {
      res
        .status(404)
        .json(new ApiError(404, "Library entry/exit record not found"));
      return;
    }

    const { userId, currentStatus, entryTimestamp, exitTimestamp } = req.body;

    const shouldAutoMarkExit =
      currentStatus === "CHECKED_OUT" && exitTimestamp === undefined;

    const updated = await updateLibraryEntryExit(id, {
      ...(userId !== undefined ? { userId: Number(userId) } : {}),
      ...(currentStatus !== undefined ? { currentStatus } : {}),
      ...(entryTimestamp !== undefined
        ? { entryTimestamp: new Date(entryTimestamp) }
        : {}),
      ...(exitTimestamp !== undefined
        ? { exitTimestamp: exitTimestamp ? new Date(exitTimestamp) : null }
        : shouldAutoMarkExit
          ? { exitTimestamp: new Date() }
          : {}),
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Library entry/exit updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteLibraryEntryExitController = async (
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

    const existing = await findLibraryEntryExitById(id);
    if (!existing) {
      res
        .status(404)
        .json(new ApiError(404, "Library entry/exit record not found"));
      return;
    }

    const deleted = await deleteLibraryEntryExit(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Library entry/exit deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
