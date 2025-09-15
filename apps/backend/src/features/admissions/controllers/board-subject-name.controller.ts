import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { errorHandler } from "@/middlewares/errorHandler.middleware";
import {
  createBoardSubjectName,
  getAllBoardSubjectNames,
  getBoardSubjectNameById,
  updateBoardSubjectName,
  deleteBoardSubjectName,
  bulkUploadBoardSubjectNames,
} from "../services/board-subject-name.service";

export async function createBoardSubjectNameHandler(
  req: Request,
  res: Response,
) {
  try {
    const boardSubjectNameData = req.body;
    const result = await createBoardSubjectName(boardSubjectNameData);
    const response = new ApiResponse(
      201,
      "CREATED",
      result,
      "Board subject name created successfully",
    );
    res.status(201).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function getAllBoardSubjectNamesHandler(
  req: Request,
  res: Response,
) {
  try {
    const boardSubjectNames = await getAllBoardSubjectNames();
    const response = new ApiResponse(
      200,
      "OK",
      boardSubjectNames,
      "Board subject names retrieved successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function getBoardSubjectNameByIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params;
    const boardSubjectName = await getBoardSubjectNameById(parseInt(id));

    if (!boardSubjectName) {
      const response = new ApiResponse(
        404,
        "NOT_FOUND",
        null,
        "Board subject name not found",
      );
      return res.status(404).json(response);
    }

    const response = new ApiResponse(
      200,
      "OK",
      boardSubjectName,
      "Board subject name retrieved successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function updateBoardSubjectNameHandler(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const result = await updateBoardSubjectName(parseInt(id), updateData);
    const response = new ApiResponse(
      200,
      "OK",
      result,
      "Board subject name updated successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function deleteBoardSubjectNameHandler(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params;
    const result = await deleteBoardSubjectName(parseInt(id));
    const response = new ApiResponse(
      200,
      "OK",
      result,
      "Board subject name deleted successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function bulkUploadBoardSubjectNamesHandler(
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

    const result = await bulkUploadBoardSubjectNames(file);
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
