import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { errorHandler } from "@/middlewares/errorHandler.middleware";
import {
  createBoardSubject,
  getAllBoardSubjects,
  getBoardSubjectById,
  getBoardSubjectsByBoardId,
  updateBoardSubject,
  deleteBoardSubject,
  bulkUploadBoardSubjects,
} from "../services/board-subject.service";

export async function createBoardSubjectHandler(req: Request, res: Response) {
  try {
    const boardSubjectData = req.body;
    const result = await createBoardSubject(boardSubjectData);
    const response = new ApiResponse(
      201,
      "CREATED",
      result,
      "Board subject created successfully",
    );
    res.status(201).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function getAllBoardSubjectsHandler(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string;
    const degreeId = req.query.degreeId
      ? parseInt(req.query.degreeId as string)
      : undefined;

    const result = await getAllBoardSubjects(page, pageSize, search, degreeId);
    const response = new ApiResponse(
      200,
      "OK",
      result,
      "Board subjects retrieved successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function getBoardSubjectByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const boardSubject = await getBoardSubjectById(parseInt(id as string));

    if (!boardSubject) {
      const response = new ApiResponse(
        404,
        "NOT_FOUND",
        null,
        "Board subject not found",
      );
      return res.status(404).json(response);
    }

    const response = new ApiResponse(
      200,
      "OK",
      boardSubject,
      "Board subject retrieved successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function getBoardSubjectsByBoardIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const { boardId } = req.params;
    const boardSubjects = await getBoardSubjectsByBoardId(
      parseInt(boardId as string),
    );
    const response = new ApiResponse(
      200,
      "OK",
      boardSubjects,
      "Board subjects retrieved successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function updateBoardSubjectHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const result = await updateBoardSubject(parseInt(id as string), updateData);
    const response = new ApiResponse(
      200,
      "OK",
      result,
      "Board subject updated successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function deleteBoardSubjectHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await deleteBoardSubject(parseInt(id as string));
    const response = new ApiResponse(
      200,
      "OK",
      result,
      "Board subject deleted successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function bulkUploadBoardSubjectsHandler(
  req: Request,
  res: Response,
) {
  try {
    const file = req.file;
    if (!file) {
      const response = new ApiResponse(
        400,
        "BAD_REQUEST",
        null,
        "No file uploaded",
      );
      return res.status(400).json(response);
    }

    const result = await bulkUploadBoardSubjects(file);
    const response = new ApiResponse(
      200,
      "OK",
      result,
      "Bulk upload completed",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}
