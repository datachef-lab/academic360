import { NextFunction, Response, Request } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  findAllPostOffices,
  findPostOfficeById,
  createPostOffice as createPostOfficeService,
  updatePostOffice as updatePostOfficeService,
  deletePostOffice as deletePostOfficeService,
} from "@/features/resources/services/postOffice.service.js";

export const createPostOffice = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, stateId, legacyPostOfficeId } = req.body;
    if (!name || typeof name !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Name is required and must be a string"));
      return;
    }
    const created = await createPostOfficeService({
      name,
      stateId: stateId ? Number(stateId) : null,
      // legacyPostOfficeId is NOT NULL with no default; use 0 for new rows.
      legacyPostOfficeId: legacyPostOfficeId ?? 0,
    });
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Post office created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllPostOffice = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await findAllPostOffices();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "All post offices fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getPostOfficeById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }
    const row = await findPostOfficeById(id);
    if (!row) {
      res.status(404).json(new ApiError(404, "Post office not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Post office fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePostOfficeRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }
    const { name, stateId } = req.body;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (stateId !== undefined) data.stateId = stateId ? Number(stateId) : null;
    const updated = await updatePostOfficeService(id, data);
    if (!updated) {
      res.status(404).json(new ApiError(404, "Post office not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Post office updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deletePostOfficeRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }
    const deleted = await deletePostOfficeService(id);
    if (!deleted) {
      res.status(404).json(new ApiError(404, "Post office not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Post office deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
