import { NextFunction, Request, Response } from "express";
import { ApiResponse, ApiError, handleError } from "@/utils/index.js";
import {
  createMarksheetPaperComponentMapping,
  getAllMarksheetPaperComponentMappings,
  getMarksheetPaperComponentMappingById,
  updateMarksheetPaperComponentMapping,
  deleteMarksheetPaperComponentMapping,
  getMarksheetPaperComponentMappingsByMarksheetPaperMappingId,
} from "../services/marksheet-paper-component-mapping.service.js";

// Create a new marksheet-paper-component mapping
export const createMarksheetPaperComponentMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mapping = await createMarksheetPaperComponentMapping(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          mapping,
          "Marksheet-Paper-Component mapping created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all marksheet-paper-component mappings with pagination and filters
export const getAllMarksheetPaperComponentMappingsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      marksheetPaperMappingId,
      paperComponentId,
    } = req.query;

    const mappings = await getAllMarksheetPaperComponentMappings({
      page: Number(page),
      pageSize: Number(pageSize),
      marksheetPaperMappingId: marksheetPaperMappingId
        ? Number(marksheetPaperMappingId)
        : undefined,
      paperComponentId: paperComponentId ? Number(paperComponentId) : undefined,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mappings,
          "Marksheet-Paper-Component mappings fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get marksheet-paper-component mapping by ID
export const getMarksheetPaperComponentMappingByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const mapping = await getMarksheetPaperComponentMappingById(id);

    if (!mapping) {
      res
        .status(404)
        .json(new ApiError(404, "Marksheet-Paper-Component mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mapping,
          "Marksheet-Paper-Component mapping fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update marksheet-paper-component mapping
export const updateMarksheetPaperComponentMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const mapping = await updateMarksheetPaperComponentMapping(id, req.body);

    if (!mapping) {
      res
        .status(404)
        .json(new ApiError(404, "Marksheet-Paper-Component mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mapping,
          "Marksheet-Paper-Component mapping updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete marksheet-paper-component mapping
export const deleteMarksheetPaperComponentMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteMarksheetPaperComponentMapping(id);

    if (!deleted) {
      res
        .status(404)
        .json(new ApiError(404, "Marksheet-Paper-Component mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Marksheet-Paper-Component mapping deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get marksheet-paper-component mappings by marksheet-paper mapping ID
export const getMarksheetPaperComponentMappingsByMarksheetPaperMappingIdController =
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const marksheetPaperMappingId = Number(
        req.params.marksheetPaperMappingId,
      );
      const { page = 1, pageSize = 10 } = req.query;

      const mappings =
        await getMarksheetPaperComponentMappingsByMarksheetPaperMappingId(
          marksheetPaperMappingId,
          {
            page: Number(page),
            pageSize: Number(pageSize),
          },
        );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            mappings,
            "Marksheet-Paper-Component mappings fetched successfully",
          ),
        );
    } catch (error) {
      handleError(error, res, next);
    }
  };
