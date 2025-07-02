import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createSubject,
  findSubjectById,
  findSubjectsByAcademicInfoId,
  updateSubject,
  deleteSubject
} from "../services/student-academic-subject.service";

export const createStudentAcademicSubjectHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createSubject(req.body);
    res.status(201).json(new ApiResponse(201, "SUCCESS", result, "Student academic subject created successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getStudentAcademicSubjectByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findSubjectById(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Student academic subject with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Student academic subject fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getStudentAcademicSubjectsByAcademicInfoIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await findSubjectsByAcademicInfoId(Number(req.params.academicInfoId));
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Student academic subjects fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateStudentAcademicSubjectHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await updateSubject({ ...req.body, id: Number(req.params.id) });
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Student academic subject with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", result, `Student academic subject with ID ${req.params.id} updated successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteStudentAcademicSubjectHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteSubject(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Student academic subject with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", { success: result }, `Student academic subject with ID ${req.params.id} deleted successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
}; 