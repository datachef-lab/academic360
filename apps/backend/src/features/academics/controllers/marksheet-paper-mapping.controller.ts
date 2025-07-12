import { NextFunction, Request, Response } from "express";
import { ApiResponse, ApiError, handleError } from "@/utils/index.js";
import {
  createMarksheetPaperMapping,
  getAllMarksheetPaperMappings,
  getMarksheetPaperMappingById,
  updateMarksheetPaperMapping,
  deleteMarksheetPaperMapping,
  getMarksheetPaperMappingsByMarksheetId,
} from "../services/marksheet-paper-mapping.service";

// Create a new marksheet-paper mapping
export const createMarksheetPaperMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mapping = await createMarksheetPaperMapping(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          mapping,
          "Marksheet-Paper mapping created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all marksheet-paper mappings with pagination and filters
export const getAllMarksheetPaperMappingsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      marksheetId,
      batchStudentPaperId,
    } = req.query;

    const mappings = await getAllMarksheetPaperMappings({
      page: Number(page),
      pageSize: Number(pageSize),
      marksheetId: marksheetId ? Number(marksheetId) : undefined,
      batchStudentPaperId: batchStudentPaperId
        ? Number(batchStudentPaperId)
        : undefined,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mappings,
          "Marksheet-Paper mappings fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get marksheet-paper mapping by ID
export const getMarksheetPaperMappingByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const mapping = await getMarksheetPaperMappingById(id);

    if (!mapping) {
      res
        .status(404)
        .json(new ApiError(404, "Marksheet-Paper mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mapping,
          "Marksheet-Paper mapping fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update marksheet-paper mapping
export const updateMarksheetPaperMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const mapping = await updateMarksheetPaperMapping(id, req.body);

    if (!mapping) {
      res
        .status(404)
        .json(new ApiError(404, "Marksheet-Paper mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mapping,
          "Marksheet-Paper mapping updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete marksheet-paper mapping
export const deleteMarksheetPaperMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteMarksheetPaperMapping(id);

    if (!deleted) {
      res
        .status(404)
        .json(new ApiError(404, "Marksheet-Paper mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Marksheet-Paper mapping deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get marksheet-paper mappings by marksheet ID
export const getMarksheetPaperMappingsByMarksheetIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const marksheetId = Number(req.params.marksheetId);
    const { page = 1, pageSize = 10 } = req.query;

    const mappings = await getMarksheetPaperMappingsByMarksheetId(marksheetId, {
      page: Number(page),
      pageSize: Number(pageSize),
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mappings,
          "Marksheet-Paper mappings fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
