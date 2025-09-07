import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createRegulationType,
  findById,
  getAllRegulationTypes,
  updateRegulationType,
  deleteRegulationTypeSafe,
  bulkUploadRegulationTypes,
} from "@/features/course-design/services/regulation-type.service.js";
import { socketService } from "@/services/socketService.js";

export const createRegulationTypeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const created = await createRegulationType(req.body);
    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Regulation type already exists",
          ),
        );
      return;
    }
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Regulation type created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getRegulationTypeByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const regulationType = await findById(id);
    if (!regulationType)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Regulation type with ID ${id} not found`,
          ),
        );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          regulationType,
          "Regulation type fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllRegulationTypesHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const regulationTypes = await getAllRegulationTypes();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          regulationTypes,
          "All regulation types fetched",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateRegulationTypeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateRegulationType(id, req.body);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Regulation type not found"),
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
          "Regulation type updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteRegulationTypeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const result = await deleteRegulationTypeSafe(id);
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Regulation type not found"),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          result as any,
          (result as any).message ?? "",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const bulkUploadRegulationTypesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const uploadSessionId =
      req.body.uploadSessionId || req.query.uploadSessionId;
    const io = socketService.getIO();
    const result = await bulkUploadRegulationTypes(
      req.file.path,
      io,
      uploadSessionId,
    );
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Bulk upload completed"));
  } catch (error: unknown) {
    handleError(error, res, next);
  }
};
