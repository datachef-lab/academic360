import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createSubjectGroupingSubject,
  deleteSubjectGroupingSubject,
  getAllSubjectGroupingSubjects,
  getSubjectGroupingSubjectById,
  updateSubjectGroupingSubject,
} from "../services/subject-grouping-sub.service.js";

export async function createSubjectGroupingSubjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const created = await createSubjectGroupingSubject(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Subject grouping subject created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getAllSubjectGroupingSubjectsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await getAllSubjectGroupingSubjects();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Subject grouping subjects fetched",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getSubjectGroupingSubjectByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const row = await getSubjectGroupingSubjectById(id);
    if (!row) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject grouping subject not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Subject grouping subject fetched",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateSubjectGroupingSubjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const updated = await updateSubjectGroupingSubject(id, req.body);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject grouping subject not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Subject grouping subject updated",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteSubjectGroupingSubjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteSubjectGroupingSubject(id);
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject grouping subject not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Subject grouping subject deleted",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
