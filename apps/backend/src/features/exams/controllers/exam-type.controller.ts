import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createExamType as createExamTypeService,
  deleteExamTypeSafe as deleteExamTypeSafeService,
  findExamTypeById,
  getAllExamTypes as getAllExamTypesService,
  updateExamType as updateExamTypeService,
} from "../services/exam-type.service.js";

export const createExamType = async (req: Request, res: Response) => {
  try {
    const userId = (req as any)?.user?.id as number | undefined;
    const created = await createExamTypeService(req.body, userId);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Exam type created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllExamTypes = async (_req: Request, res: Response) => {
  try {
    const examTypes = await getAllExamTypesService();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", examTypes, "Exam types fetched."));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getExamTypeById = async (req: Request, res: Response) => {
  try {
    const examType = await findExamTypeById(Number(req.params.id));
    if (!examType) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Exam type not found."));
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          examType,
          "Exam type fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateExamType = async (req: Request, res: Response) => {
  try {
    const userId = (req as any)?.user?.id as number | undefined;
    const updated = await updateExamTypeService(
      Number(req.params.id),
      req.body,
      userId,
    );
    if (!updated) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Exam type not found."));
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "Exam type updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteExamType = async (req: Request, res: Response) => {
  try {
    const userId = (req as any)?.user?.id as number | undefined;
    const result = await deleteExamTypeSafeService(
      Number(req.params.id),
      userId,
    );

    if (result === null) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Exam type not found."));
    }

    if (result.success === false) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", result.records, result.message));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "DELETED", null, result.message ?? "Deleted."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};
