import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createFromInput,
  findAll,
  findById,
  remove,
  updateFromDto,
} from "../services/subject-selection-meta.service.js";

export async function createSubjectSelectionMetaHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const created = await createFromInput(req.body);
    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Failed to create subject selection meta. Invalid input or missing references.",
          ),
        );
      return;
    }
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Subject selection meta created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, req, res, next);
  }
}

export async function getAllSubjectSelectionMetasHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await findAll();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Fetched metas"));
  } catch (error) {
    handleError(error, req, res, next);
  }
}

export async function getSubjectSelectionMetaByIdHandler(
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
            "Subject selection meta not found",
          ),
        );
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", row, "Fetched meta"));
  } catch (error) {
    handleError(error, req, res, next);
  }
}

export async function updateSubjectSelectionMetaHandler(
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
            "Subject selection meta not found or update failed",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", updated, "Updated meta"));
  } catch (error) {
    handleError(error, req, res, next);
  }
}

export async function deleteSubjectSelectionMetaHandler(
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
            "Subject selection meta not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", deleted, "Deleted meta"));
  } catch (error) {
    handleError(error, req, res, next);
  }
}
