import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { errorHandler } from "@/middlewares/errorHandler.middleware";
import {
  createBoard,
  getAllBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  bulkUploadBoards,
} from "../services/board.service";

export async function createBoardHandler(req: Request, res: Response) {
  try {
    const boardData = req.body;
    const result = await createBoard(boardData);
    const response = new ApiResponse(
      201,
      "CREATED",
      result,
      "Board created successfully",
    );
    res.status(201).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function getAllBoardsHandler(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string;
    const degreeId = req.query.degreeId
      ? parseInt(req.query.degreeId as string)
      : undefined;

    const result = await getAllBoards(page, pageSize, search, degreeId);
    const response = new ApiResponse(
      200,
      "OK",
      result,
      "Boards retrieved successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function getBoardByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const board = await getBoardById(parseInt(id));

    if (!board) {
      const response = new ApiResponse(
        404,
        "NOT_FOUND",
        null,
        "Board not found",
      );
      return res.status(404).json(response);
    }

    const response = new ApiResponse(
      200,
      "OK",
      board,
      "Board retrieved successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function updateBoardHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const result = await updateBoard(parseInt(id), updateData);
    const response = new ApiResponse(
      200,
      "OK",
      result,
      "Board updated successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function deleteBoardHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await deleteBoard(parseInt(id));
    const response = new ApiResponse(
      200,
      "OK",
      result,
      "Board deleted successfully",
    );
    res.status(200).json(response);
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

export async function bulkUploadBoardsHandler(req: Request, res: Response) {
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

    const result = await bulkUploadBoards(file);
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
