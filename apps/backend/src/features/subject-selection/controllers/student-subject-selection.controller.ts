import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createStudentSubjectSelectionFromDto,
  deleteStudentSubjectSelection,
  getStudentSubjectSelectionById,
  getStudentSubjectSelectionsPaginated,
  updateStudentSubjectSelectionFromDto,
} from "../services/student-subject-selection.service.js";

export async function listStudentSubjectSelections(
  req: Request,
  res: Response,
) {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const studentId = req.query.studentId
      ? Number(req.query.studentId)
      : undefined;
    const sessionId = req.query.sessionId
      ? Number(req.query.sessionId)
      : undefined;
    const result = await getStudentSubjectSelectionsPaginated({
      page,
      pageSize,
      studentId,
      sessionId,
    });
    return res.status(200).json(new ApiResponse(200, "OK", result, "Fetched"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return res
      .status(500)
      .json(new ApiResponse(500, "INTERNAL_SERVER_ERROR", null, message));
  }
}

export async function getStudentSubjectSelection(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const item = await getStudentSubjectSelectionById(id);
    if (!item)
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Not found"));
    return res.status(200).json(new ApiResponse(200, "OK", item, "Fetched"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return res
      .status(500)
      .json(new ApiResponse(500, "INTERNAL_SERVER_ERROR", null, message));
  }
}

export async function createStudentSubjectSelectionController(
  req: Request,
  res: Response,
) {
  try {
    const created = await createStudentSubjectSelectionFromDto(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, "CREATED", created, "Created"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return res
      .status(500)
      .json(new ApiResponse(500, "INTERNAL_SERVER_ERROR", null, message));
  }
}

export async function updateStudentSubjectSelectionController(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);
    const updated = await updateStudentSubjectSelectionFromDto(id, req.body);
    return res.status(200).json(new ApiResponse(200, "OK", updated, "Updated"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return res
      .status(500)
      .json(new ApiResponse(500, "INTERNAL_SERVER_ERROR", null, message));
  }
}

export async function deleteStudentSubjectSelectionController(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteStudentSubjectSelection(id);
    return res.status(200).json(new ApiResponse(200, "OK", deleted, "Deleted"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return res
      .status(500)
      .json(new ApiResponse(500, "INTERNAL_SERVER_ERROR", null, message));
  }
}
