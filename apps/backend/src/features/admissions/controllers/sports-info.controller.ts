import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createSportsInfo,
  getSportsInfoById,
  getSportsInfoByAdditionalInfoId,
  updateSportsInfo,
  deleteSportsInfo
} from "../services/sports-info.service.js";

export const createSportsInfoHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createSportsInfo(req.body);
    res.status(201).json(new ApiResponse(201, "SUCCESS", result, "Sports info created successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getSportsInfoByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getSportsInfoById(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Sports info with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Sports info fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getSportsInfoByAdditionalInfoIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getSportsInfoByAdditionalInfoId(Number(req.params.additionalInfoId));
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Sports info fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateSportsInfoHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await updateSportsInfo(Number(req.params.id), req.body);
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Sports info with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", result, `Sports info with ID ${req.params.id} updated successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteSportsInfoHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteSportsInfo(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Sports info with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", { success: result }, `Sports info with ID ${req.params.id} deleted successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
}; 