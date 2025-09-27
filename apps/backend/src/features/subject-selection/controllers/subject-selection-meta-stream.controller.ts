import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createFromDto,
  findAll,
  findById,
  remove,
  updateFromDto,
} from "../services/subject-selection-meta-stream.service.js";

export async function createSubjectSelectionMetaStreamHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const created = await createFromDto(req.body);
    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Failed to create subject selection meta stream. Invalid input or missing references.",
          ),
        );
      return;
    }
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", created, "Created meta-stream"));
  } catch (error) {
    handleError(error, req, res, next);
  }
}

export async function getAllSubjectSelectionMetaStreamsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await findAll();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Fetched meta-streams"));
  } catch (error) {
    handleError(error, req, res, next);
  }
}

export async function getSubjectSelectionMetaStreamByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const row = await findById(id);
    if (!row) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject selection meta stream not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Fetched meta-stream"));
  } catch (error) {
    handleError(error, req, res, next);
  }
}

export async function updateSubjectSelectionMetaStreamHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const updated = await updateFromDto(id, req.body);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject selection meta stream not found or update failed",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", updated, "Updated meta-stream"));
  } catch (error) {
    handleError(error, req, res, next);
  }
}

export async function deleteSubjectSelectionMetaStreamHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const deleted = await remove(id);
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject selection meta stream not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", deleted, "Deleted meta-stream"));
  } catch (error) {
    handleError(error, req, res, next);
  }
}
