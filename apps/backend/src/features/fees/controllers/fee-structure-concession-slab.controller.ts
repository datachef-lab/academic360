import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as feeStructureConcessionSlabService from "../services/fee-structure-concession-slab.service.js";
import { createFeeStructureConcessionSlabSchema } from "@repo/db/schemas/models/fees";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

export const createFeeStructureConcessionSlab = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parse = createFeeStructureConcessionSlabSchema.safeParse(
      req.body as z.input<typeof createFeeStructureConcessionSlabSchema>,
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
      z.infer<typeof createFeeStructureConcessionSlabSchema>,
      "id" | "createdAt" | "updatedAt"
    >;
    const created =
      await feeStructureConcessionSlabService.createFeeStructureConcessionSlab(
        body,
      );

    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "ERROR",
            null,
            "Failed to create fee structure concession slab",
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
          "Fee structure concession slab created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllFeeStructureConcessionSlabs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const all =
      await feeStructureConcessionSlabService.getAllFeeStructureConcessionSlabs();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          all,
          "Fetched fee structure concession slabs",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getFeeStructureConcessionSlabById = async (
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

    const found =
      await feeStructureConcessionSlabService.getFeeStructureConcessionSlabById(
        id,
      );

    if (!found) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Fee structure concession slab not found",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          found,
          "Fetched fee structure concession slab",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateFeeStructureConcessionSlab = async (
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

    const partialSchema = createFeeStructureConcessionSlabSchema.partial();
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
      z.infer<typeof createFeeStructureConcessionSlabSchema>
    >;
    const updated =
      await feeStructureConcessionSlabService.updateFeeStructureConcessionSlab(
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
            "Fee structure concession slab not found or update failed",
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
          "Fee structure concession slab updated",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteFeeStructureConcessionSlab = async (
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

    const deleted =
      await feeStructureConcessionSlabService.deleteFeeStructureConcessionSlab(
        id,
      );

    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Fee structure concession slab not found or delete failed",
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
          "Fee structure concession slab deleted",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
