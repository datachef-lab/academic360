import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createFromDto,
  findAll,
  findById,
  remove,
  updateFromDto,
} from "../services/subject-selection-meta-class.service.js";

export async function createSubjectSelectionMetaClassHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const created = await createFromDto(req.body);
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", created, "Created meta-class"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getAllSubjectSelectionMetaClassesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await findAll();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Fetched meta-classes"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getSubjectSelectionMetaClassByIdHandler(
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
        .json(new ApiResponse(404, "NOT_FOUND", null, "Not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Fetched meta-class"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateSubjectSelectionMetaClassHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const updated = await updateFromDto(id, req.body);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", updated, "Updated meta-class"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteSubjectSelectionMetaClassHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const deleted = await remove(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", deleted, "Deleted meta-class"));
  } catch (error) {
    handleError(error, res, next);
  }
}
