import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createSubjectGroupingProgramCourse,
  deleteSubjectGroupingProgramCourse,
  getAllSubjectGroupingProgramCourses,
  getSubjectGroupingProgramCourseById,
  updateSubjectGroupingProgramCourse,
} from "../services/subject-grouping-program-course.service.js";

export async function createSubjectGroupingProgramCourseHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const created = await createSubjectGroupingProgramCourse(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Subject grouping program course created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getAllSubjectGroupingProgramCoursesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await getAllSubjectGroupingProgramCourses();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Subject grouping program courses fetched",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getSubjectGroupingProgramCourseByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const row = await getSubjectGroupingProgramCourseById(id);
    if (!row) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject grouping program course not found",
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
          "Subject grouping program course fetched",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateSubjectGroupingProgramCourseHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const updated = await updateSubjectGroupingProgramCourse(id, req.body);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject grouping program course not found",
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
          "Subject grouping program course updated",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteSubjectGroupingProgramCourseHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteSubjectGroupingProgramCourse(id);
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject grouping program course not found",
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
          "Subject grouping program course deleted",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
