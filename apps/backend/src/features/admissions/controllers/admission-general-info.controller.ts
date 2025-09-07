import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createGeneralInfo,
  findGeneralInfoById,
  findGeneralInfoByApplicationFormId,
  updateGeneralInfo,
  deleteGeneralInfo,
} from "../services/admission-general-info.service.js";

export const createAdmissionGeneralInfoHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await createGeneralInfo(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          result,
          "General info created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionGeneralInfoByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await findGeneralInfoById(Number(req.params.id));
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `General info with ID ${req.params.id} not found`,
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
          result,
          "General info fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionGeneralInfoByApplicationFormIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await findGeneralInfoByApplicationFormId(
      Number(req.params.applicationFormId),
    );
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `General info for application form ID ${req.params.applicationFormId} not found`,
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
          result,
          "General info fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAdmissionGeneralInfoHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await updateGeneralInfo({
      ...req.body,
      id: Number(req.params.id),
    });
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `General info with ID ${req.params.id} not found`,
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
          result,
          `General info with ID ${req.params.id} updated successfully!`,
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAdmissionGeneralInfoHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await deleteGeneralInfo(Number(req.params.id));
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `General info with ID ${req.params.id} not found`,
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
          { success: result },
          `General info with ID ${req.params.id} deleted successfully!`,
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
