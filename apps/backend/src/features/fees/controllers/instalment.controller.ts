import { Request, Response, NextFunction } from "express";
import * as instalmentService from "../services/fee-structure-installment.service.js";
import {
  FeeStructureInstallment,
  createFeeStructureInstallmentSchema,
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
  const dateFields = [
    "startDate",
    "endDate",
    "onlineStartDate",
    "onlineEndDate",
    "createdAt",
    "updatedAt",
  ];
  for (const f of dateFields) {
    if (obj[f]) obj[f] = toDate(obj[f]);
  }
}

export const createInstalment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parseResult = createFeeStructureInstallmentSchema.safeParse(
      req.body as any,
    );
    if (!parseResult.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parseResult.error.flatten()),
          ),
        );
      return;
    }
    const body = parseResult.data as Omit<FeeStructureInstallment, "id">;
    convertDates(body as any);
    const created = await instalmentService.createFeeStructureInstallment(body);
    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "ERROR", null, "Failed to create instalment"),
        );
      return;
    }
    res
      .status(201)
      .json(new ApiResponse(201, "CREATED", created, "Instalment created"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getInstalmentById = async (
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
    const instalment =
      await instalmentService.getFeeStructureInstallmentById(id);
    if (!instalment) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Instalment not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", instalment, "Fetched instalment"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllInstalments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const instalments =
      await instalmentService.getAllFeeStructureInstallments();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", instalments, "Fetched all instalments"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getInstalmentsByFeesStructureId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const feesStructureId = Number(req.params.feesStructureId);
    if (isNaN(feesStructureId)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const instalments =
      await instalmentService.getFeeStructureInstallmentsByFeeStructureId(
        feesStructureId,
      );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          instalments,
          "Fetched instalments for fee structure",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateInstalment = async (
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
    const parseResult = createFeeStructureInstallmentSchema
      .partial()
      .safeParse(req.body as any);
    if (!parseResult.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parseResult.error.flatten()),
          ),
        );
      return;
    }
    const body = parseResult.data as Partial<FeeStructureInstallment>;
    convertDates(body as any);
    const updated = await instalmentService.updateFeeStructureInstallment(
      id,
      body,
    );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Instalment not found or update failed",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "Instalment updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteInstalment = async (
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
    const deleted = await instalmentService.deleteFeeStructureInstallment(id);
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Instalment not found or delete failed",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Instalment deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
