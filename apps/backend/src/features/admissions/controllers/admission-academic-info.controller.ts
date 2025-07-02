import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAcademicInfo,
  findAcademicInfoById,
  findAcademicInfoByApplicationFormId,
  updateAcademicInfo,
  deleteAcademicInfo
} from "../services/admission-academic-info.service.js";

export const createAdmissionAcademicInfoHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createAcademicInfo(req.body);
    res.status(201).json(new ApiResponse(201, "SUCCESS", result, "Academic info created successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionAcademicInfoByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findAcademicInfoById(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Academic info with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Academic info fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionAcademicInfoByApplicationFormIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findAcademicInfoByApplicationFormId(Number(req.params.applicationFormId));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Academic info for application form ID ${req.params.applicationFormId} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Academic info fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAdmissionAcademicInfoHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await updateAcademicInfo({ ...req.body, id: Number(req.params.id) });
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Academic info with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", result, `Academic info with ID ${req.params.id} updated successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAdmissionAcademicInfoHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteAcademicInfo(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Academic info with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", { success: result }, `Academic info with ID ${req.params.id} deleted successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
}; 