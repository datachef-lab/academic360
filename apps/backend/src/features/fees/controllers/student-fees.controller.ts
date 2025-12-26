import { Request, Response, NextFunction } from "express";
import * as studentFeeService from "../services/student-fees.service.js";
import {
  createStudentFeeSchema,
  StudentFee,
} from "@repo/db/schemas/models/fees";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

function toDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") return new Date(val);
  return val;
}

function convertDates(obj: Record<string, any>) {
  const dateFields = ["transactionDate", "createdAt", "updatedAt"];
  for (const f of dateFields) {
    if (obj[f]) obj[f] = toDate(obj[f]);
  }
}

export const createStudentFee = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parse = createStudentFeeSchema.safeParse(req.body as any);
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
    const body = parse.data as Omit<StudentFee, "id">;
    convertDates(body as any);
    const created = await studentFeeService.createStudentFee(body as any);
    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "ERROR", null, "Failed to create student fee"),
        );
      return;
    }
    res
      .status(201)
      .json(new ApiResponse(201, "CREATED", created, "Student fee created"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllStudentFees = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const all = await studentFeeService.getAllStudentFees();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", all, "Fetched student fees"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getStudentFeeById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const found = await studentFeeService.getStudentFeeById(id);
    if (!found) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Student fee not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", found, "Fetched student fee"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateStudentFee = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const parse = createStudentFeeSchema.partial().safeParse(req.body as any);
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
    const body = parse.data as Partial<StudentFee>;
    convertDates(body as any);
    const updated = await studentFeeService.updateStudentFee(id, body as any);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Student fee not found or update failed",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "UPDATED", updated, "Student fee updated"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteStudentFee = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const deleted = await studentFeeService.deleteStudentFee(id);
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Student fee not found or delete failed",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "DELETED", deleted, "Student fee deleted"));
  } catch (error) {
    handleError(error, res, next);
  }
};
