import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as feeStructureSlabService from "../services/fee-structure-slab.service.js";
import { createFeeStructureSlabSchema } from "@repo/db/schemas/models/fees";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

export const createFeeStructureSlab = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parse = createFeeStructureSlabSchema.safeParse(
      req.body as z.input<typeof createFeeStructureSlabSchema>,
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
      z.infer<typeof createFeeStructureSlabSchema>,
      "id" | "createdAt" | "updatedAt"
    >;
    const created = await feeStructureSlabService.createFeeStructureSlab(body);

    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "ERROR",
            null,
            "Failed to create fee structure slab",
          ),
        );
      return;
    }

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "CREATED",
          created,
          "Fee structure slab created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllFeeStructureSlabs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const all = await feeStructureSlabService.getAllFeeStructureSlabs();

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", all, "Fetched fee structure slabs"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getFeeStructureSlabById = async (
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

    const found = await feeStructureSlabService.getFeeStructureSlabById(id);

    if (!found) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Fee structure slab not found",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", found, "Fetched fee structure slab"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateFeeStructureSlab = async (
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

    const partialSchema = createFeeStructureSlabSchema.partial();
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

    const body = parse.data as Partial<
      z.infer<typeof createFeeStructureSlabSchema>
    >;
    const updated = await feeStructureSlabService.updateFeeStructureSlab(
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
            "Fee structure slab not found or update failed",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "UPDATED", updated, "Fee structure slab updated"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteFeeStructureSlab = async (
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

    const deleted = await feeStructureSlabService.deleteFeeStructureSlab(id);

    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Fee structure slab not found or delete failed",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "DELETED", deleted, "Fee structure slab deleted"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
