import { NextFunction, Request, Response } from "express";
import { ApiResponse, ApiError, handleError } from "@/utils/index.js";
import {
  createBatchStudentMapping,
  getAllBatchStudentMappings,
  getBatchStudentMappingById,
  updateBatchStudentMapping,
  deleteBatchStudentMapping,
  getBatchStudentMappingsByBatchId,
  getBatchStudentMappingsByStudentId,
} from "../services/batch-student-mapping.service";

// Create a new batch-student mapping
export const createBatchStudentMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mapping = await createBatchStudentMapping(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          mapping,
          "Batch-Student mapping created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all batch-student mappings with pagination and filters
export const getAllBatchStudentMappingsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, pageSize = 10, batchId, studentId } = req.query;

    const mappings = await getAllBatchStudentMappings({
      page: Number(page),
      pageSize: Number(pageSize),
      batchId: batchId ? Number(batchId) : undefined,
      studentId: studentId ? Number(studentId) : undefined,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mappings,
          "Batch-Student mappings fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get batch-student mapping by ID
export const getBatchStudentMappingByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const mapping = await getBatchStudentMappingById(id);

    if (!mapping) {
      res
        .status(404)
        .json(new ApiError(404, "Batch-Student mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mapping,
          "Batch-Student mapping fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update batch-student mapping
export const updateBatchStudentMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const mapping = await updateBatchStudentMapping(id, req.body);

    if (!mapping) {
      res
        .status(404)
        .json(new ApiError(404, "Batch-Student mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mapping,
          "Batch-Student mapping updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete batch-student mapping
export const deleteBatchStudentMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteBatchStudentMapping(id);

    if (!deleted) {
      res
        .status(404)
        .json(new ApiError(404, "Batch-Student mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Batch-Student mapping deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get batch-student mappings by batch ID
export const getBatchStudentMappingsByBatchIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const batchId = Number(req.params.batchId);
    const { page = 1, pageSize = 10 } = req.query;

    const mappings = await getBatchStudentMappingsByBatchId(batchId, {
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
          "Batch-Student mappings fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get batch-student mappings by student ID
export const getBatchStudentMappingsByStudentIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = Number(req.params.studentId);
    const { page = 1, pageSize = 10 } = req.query;

    const mappings = await getBatchStudentMappingsByStudentId(studentId, {
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
          "Batch-Student mappings fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
