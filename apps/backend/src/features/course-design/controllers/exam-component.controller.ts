import { Request, Response } from "express";
import {
  createExamComponent as createExamComponentService,
  getAllExamComponents as getAllExamComponentsService,
  findExamComponentById as getExamComponentByIdService,
  updateExamComponent as updateExamComponentService,
  deleteExamComponentSafe as deleteExamComponentService,
} from "../services/exam-component.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";

export const createExamComponent = async (req: Request, res: Response) => {
  try {
    const newExamComponent = await createExamComponentService({
      ...req.body,
      subjectId: req.body.subjectId,
    });
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newExamComponent,
          "Exam Component created successfully",
        ),
      );
  } catch (error: unknown) {
    handleError(error, res);
  }
};

export const getAllExamComponents = async (_req: Request, res: Response) => {
  try {
    const allExamComponents = await getAllExamComponentsService();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          allExamComponents,
          "Exam Components retrieved successfully",
        ),
      );
  } catch (error: unknown) {
    handleError(error, res);
  }
};

export const getExamComponentById = async (req: Request, res: Response) => {
  try {
    const examComponent = await getExamComponentByIdService(req.params.id);
    if (!examComponent) {
      return res
        .status(404)
        .json(new ApiResponse(404, "FAIL", null, "Exam Component not found"));
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          examComponent,
          "Exam Component retrieved successfully",
        ),
      );
  } catch (error: unknown) {
    handleError(error, res);
  }
};

export const updateExamComponent = async (req: Request, res: Response) => {
  try {
    const updatedExamComponent = await updateExamComponentService(
      req.params.id,
      req.body,
    );
    if (!updatedExamComponent) {
      res
        .status(404)
        .json(new ApiResponse(404, "FAIL", null, "Exam Component not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedExamComponent,
          "Exam Component updated successfully",
        ),
      );
  } catch (error: unknown) {
    handleError(error, res);
  }
};

export const deleteExamComponent = async (req: Request, res: Response) => {
  try {
    const result = await deleteExamComponentService(req.params.id);
    if (!result) {
      res
        .status(404)
        .json(new ApiResponse(404, "FAIL", null, "Exam Component not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result as any,
          (result as any).message ?? "",
        ),
      );
  } catch (error: unknown) {
    handleError(error, res);
  }
};
