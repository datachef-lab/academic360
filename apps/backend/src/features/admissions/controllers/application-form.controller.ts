import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createApplicationForm,
  findApplicationFormById,
  findApplicationFormsByAdmissionId,
  updateApplicationForm,
  deleteApplicationForm
} from "../services/application-form.service";

export const createApplicationFormHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // expects req.body to have form and generalInfo
    const { form, generalInfo } = req.body;
    const result = await createApplicationForm(form, generalInfo);
    res.status(201).json(new ApiResponse(201, "SUCCESS", result, "Application form created successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getApplicationFormByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findApplicationFormById(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Application form with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Application form fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getApplicationFormsByAdmissionIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findApplicationFormsByAdmissionId(Number(req.params.admissionId));
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Application forms fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateApplicationFormHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await updateApplicationForm(Number(req.params.id), req.body);
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Application form with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", result, `Application form with ID ${req.params.id} updated successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteApplicationFormHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteApplicationForm(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Application form with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", { success: result }, `Application form with ID ${req.params.id} deleted successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
}; 