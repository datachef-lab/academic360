import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAdmissionAdditionalInfo,
  findAdditionalInfoById,
  findAdditionalInfoByApplicationFormId,
  updateAdmissionAdditionalInfo,
  deleteAdmissionAdditionalInfo
} from "../services/admission-additional-info.service";

export const createAdmissionAdditionalInfoHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createAdmissionAdditionalInfo(req.body);
    res.status(201).json(new ApiResponse(201, "SUCCESS", result, "Additional info created successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionAdditionalInfoByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findAdditionalInfoById(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Additional info with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Additional info fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionAdditionalInfoByApplicationFormIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findAdditionalInfoByApplicationFormId(Number(req.params.applicationFormId));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Additional info for application form ID ${req.params.applicationFormId} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Additional info fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAdmissionAdditionalInfoHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await updateAdmissionAdditionalInfo({ ...req.body, id: Number(req.params.id) });
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Additional info with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", result, `Additional info with ID ${req.params.id} updated successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAdmissionAdditionalInfoHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteAdmissionAdditionalInfo(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Additional info with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", { success: result }, `Additional info with ID ${req.params.id} deleted successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
}; 