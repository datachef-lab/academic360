import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createSubjectGroupingMainFromDto,
  deleteSubjectGroupingMain,
  getAllSubjectGroupingMains,
  getSubjectGroupingMainById,
  updateSubjectGroupingMainFromDto,
} from "../services/subject-grouping-main.service.js";

export async function createSubjectGroupingMainHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = req.body as any;
    const isDtoShape =
      body &&
      body.academicYear?.id &&
      body.subjectType?.id &&
      typeof body.name === "string";
    if (!isDtoShape) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Request body must be DTO-shaped: { academicYear: { id }, subjectType: { id }, name, ... }",
          ),
        );
      return;
    }
    const created = await createSubjectGroupingMainFromDto(body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Subject grouping main created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getAllSubjectGroupingMainsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await getAllSubjectGroupingMains();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", rows, "Subject grouping mains fetched"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getSubjectGroupingMainByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const row = await getSubjectGroupingMainById(id);
    if (!row) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject grouping main not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Subject grouping main fetched"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateSubjectGroupingMainHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const body = req.body as any;
    const hasAnyDtoKey =
      body &&
      (body.academicYear?.id ||
        body.subjectType?.id ||
        typeof body.name === "string" ||
        body.code !== undefined ||
        body.description !== undefined ||
        typeof body.isActive === "boolean" ||
        Array.isArray(body.subjectGroupingProgramCourses) ||
        Array.isArray(body.subjectGroupingSubjects));
    if (!hasAnyDtoKey) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Update payload must be DTO-shaped. Use nested keys like academicYear.id, subjectType.id, subjectGroupingProgramCourses[], subjectGroupingSubjects[].",
          ),
        );
      return;
    }
    const updated = await updateSubjectGroupingMainFromDto(id, body);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject grouping main not found",
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
          "Subject grouping main updated",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteSubjectGroupingMainHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteSubjectGroupingMain(id);
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject grouping main not found",
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
          "Subject grouping main deleted",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
