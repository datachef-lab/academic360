import { Request, Response, NextFunction } from "express";
import { createTransportDetailsSchema } from "@repo/db/schemas/models/user";
import {
  addTransportDetails,
  findTransportDetailsById,
  findTransportDetailsByStudentId,
  updateTransportDetails,
  removeTransportDetails,
  removeTransportDetailsByStudentId,
  getAllTransportDetails,
} from "../services/transportDetail.service.js";
import { TransportDetails } from "@repo/db/schemas/models/user";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";

export const createTransportDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parseResult = createTransportDetailsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parseResult.error.flatten()),
          ),
        );
      return;
    }
    const newTransportDetails = await addTransportDetails(
      req.body as TransportDetails,
    );
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newTransportDetails,
          "New transport details added!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getTransportDetailsById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const found = await findTransportDetailsById(id);
    if (!found) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Transport details of ID ${id} not found`,
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
          found,
          "Fetched transport details successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getTransportDetailsByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentId = Number(req.params.studentId);
    if (isNaN(studentId)) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "INVALID_ID", null, "Invalid student ID format"),
        );
      return;
    }
    const found = await findTransportDetailsByStudentId(studentId);
    if (!found) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Transport details for studentId ${studentId} not found`,
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
          found,
          "Fetched transport details successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateTransportDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.body) {
    res
      .status(400)
      .json(
        new ApiResponse(
          400,
          "BAD_REQUEST",
          null,
          "Fields content can not be empty",
        ),
      );
    return;
  }
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const parseResult = createTransportDetailsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parseResult.error.flatten()),
          ),
        );
      return;
    }
    const updated = await updateTransportDetails(
      id,
      req.body as TransportDetails,
    );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Transport details not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "Transport details updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteTransportDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const isDeleted = await removeTransportDetails(id);
    if (isDeleted === null) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Transport details with ID ${id} not found`,
          ),
        );
      return;
    }
    if (!isDeleted) {
      res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Failed to delete transport details",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          null,
          "Transport details deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteTransportDetailsByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentId = Number(req.params.studentId);
    if (isNaN(studentId)) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "INVALID_ID", null, "Invalid student ID format"),
        );
      return;
    }
    const isDeleted = await removeTransportDetailsByStudentId(studentId);
    if (isDeleted === null) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Transport details for student ID ${studentId} not found`,
          ),
        );
      return;
    }
    if (!isDeleted) {
      res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Failed to delete transport details",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          null,
          "Transport details deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllTransportDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const details = await getAllTransportDetails();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          details,
          "Fetched all transport details successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
