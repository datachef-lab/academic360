import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as receiptTypeService from "../services/receipt-type.service.js";
import {
  createReceiptTypeSchema,
  ReceiptType,
} from "@repo/db/schemas/models/fees";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

export const createReceiptType = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      res
        .status(401)
        .json(
          new ApiResponse(
            401,
            "UNAUTHORIZED",
            null,
            "User authentication required",
          ),
        );
      return;
    }

    // Validate input - exclude auto-generated fields and user ID fields
    const schemaWithoutAutoFields = createReceiptTypeSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      createdByUserId: true,
      updatedByUserId: true,
    });
    const parse = schemaWithoutAutoFields.safeParse(
      req.body as z.input<typeof schemaWithoutAutoFields>,
    );
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

    const body = parse.data as Omit<
      ReceiptType,
      "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
    >;
    const created = await receiptTypeService.createReceiptType(body, userId);
    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "ERROR", null, "Failed to create receipt type"),
        );
      return;
    }
    res
      .status(201)
      .json(new ApiResponse(201, "CREATED", created, "Receipt type created"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllReceiptTypes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const all = await receiptTypeService.getAllReceiptTypes();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", all, "Fetched receipt types"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getReceiptTypeById = async (
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
    const found = await receiptTypeService.getReceiptTypeById(id);
    if (!found) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Receipt type not found"),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", found, "Fetched receipt type"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateReceiptType = async (
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
    const partialSchema = createReceiptTypeSchema.partial();
    const parse = partialSchema.safeParse(
      req.body as z.input<typeof partialSchema>,
    );
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
    const userId = (req.user as any)?.id;
    if (!userId) {
      res
        .status(401)
        .json(
          new ApiResponse(
            401,
            "UNAUTHORIZED",
            null,
            "User authentication required",
          ),
        );
      return;
    }

    const body = parse.data as Partial<ReceiptType>;
    const updated = await receiptTypeService.updateReceiptType(
      id,
      body,
      userId,
    );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Receipt type not found or update failed",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "UPDATED", updated, "Receipt type updated"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteReceiptType = async (
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
    const userId = (req.user as any)?.id;
    const deleted = await receiptTypeService.deleteReceiptType(id, userId);
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Receipt type not found or delete failed",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "DELETED", deleted, "Receipt type deleted"));
  } catch (error) {
    handleError(error, res, next);
  }
};
