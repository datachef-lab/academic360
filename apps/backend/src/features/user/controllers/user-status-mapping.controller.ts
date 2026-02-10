import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";

import * as userStatusMappingService from "../services/user-status-mapping.service";
import { UserStatusMappingDto } from "@repo/db/dtos";

/**
 * CREATE
 */
export const createUserStatusMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dto = req.body as UserStatusMappingDto;

    if (!dto?.userId || !dto?.userStatusMaster?.id) {
      res
        .status(400)
        .json(new ApiError(400, "userId and userStatusMasterId are required"));
      return;
    }

    const result = await userStatusMappingService.createUserStatusMapping(dto);

    if (!result.data) {
      res
        .status(result.status)
        .json(new ApiError(result.status, result.message));
      return;
    }

    res
      .status(result.status)
      .json(
        new ApiResponse(result.status, "SUCCESS", result.data, result.message),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStatusMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(new ApiError(400, "Mapping id is required"));
      return;
    }

    const result = await userStatusMappingService.getUserStatusMappingById(+id);

    if (!result.data) {
      res
        .status(result.status)
        .json(new ApiError(result.status, result.message));
      return;
    }

    res
      .status(result.status)
      .json(
        new ApiResponse(result.status, "SUCCESS", result.data, result.message),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * GET ALL MASTERS
 */
export const getAllUserStatusMastersController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await userStatusMappingService.getAllUserStatusMasters();

    res
      .status(result.status)
      .json(
        new ApiResponse(result.status, "SUCCESS", result.data, result.message),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * GET PROMOTIONS BY STUDENT
 */
export const getPromotionsByStudentIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = Number(req.params.studentId);

    if (!studentId || Number.isNaN(studentId)) {
      res.status(400).json(new ApiError(400, "Valid studentId is required"));
      return;
    }

    const result =
      await userStatusMappingService.getPromotionsByStudentId(studentId);

    res
      .status(result.status)
      .json(
        new ApiResponse(result.status, "SUCCESS", result.data, result.message),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * GET BY STUDENT
 */
export const getUserStatusMappingsByStudentIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = Number(req.params.studentId);

    if (!studentId || Number.isNaN(studentId)) {
      res.status(400).json(new ApiError(400, "Valid studentId is required"));
      return;
    }

    const result =
      await userStatusMappingService.getUserStatusMappingsByStudentId(
        studentId,
      );

    res
      .status(result.status)
      .json(
        new ApiResponse(result.status, "SUCCESS", result.data, result.message),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * UPDATE
 */
export const updateUserStatusMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dto = req.body as UserStatusMappingDto;

    if (!dto?.id) {
      res.status(400).json(new ApiError(400, "Mapping id is required"));
      return;
    }

    const result = await userStatusMappingService.updateUserStatusMapping(dto);

    if (!result.data) {
      res
        .status(result.status)
        .json(new ApiError(result.status, result.message));
      return;
    }

    res
      .status(result.status)
      .json(
        new ApiResponse(result.status, "SUCCESS", result.data, result.message),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * DELETE
 */
export const deleteUserStatusMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid mapping id"));
      return;
    }

    const result = await userStatusMappingService.deleteUserStatusMapping(id);

    if (!result.data) {
      res
        .status(result.status)
        .json(new ApiError(result.status, result.message));
      return;
    }

    res
      .status(result.status)
      .json(
        new ApiResponse(result.status, "SUCCESS", result.data, result.message),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
