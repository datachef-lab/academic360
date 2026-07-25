import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as feeDueDeclarationService from "../services/fee-due-declaration.service.js";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

const createBodySchema = z.object({
  studentId: z.number().int().positive(),
  semesterLabel: z.string().trim().min(1).max(255),
  undertakingClearDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getFeeDueDeclaration = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentId = Number(req.params.studentId);
    const semesterLabel = String(req.query.semesterLabel ?? "").trim();
    if (!Number.isInteger(studentId) || studentId <= 0 || !semesterLabel) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            "studentId param and semesterLabel query are required",
          ),
        );
      return;
    }
    const declaration = await feeDueDeclarationService.findFeeDueDeclaration(
      studentId,
      semesterLabel,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          declaration,
          declaration
            ? "Fee due declaration found"
            : "No fee due declaration for this student and semester",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createFeeDueDeclaration = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parse = createBodySchema.safeParse(req.body);
    if (!parse.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parse.error.flatten()),
          ),
        );
      return;
    }
    const declaration = await feeDueDeclarationService.createFeeDueDeclaration(
      parse.data,
    );
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "CREATED",
          declaration,
          "Fee due declaration recorded",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
