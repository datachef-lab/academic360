import { Request, Response } from "express";
import {
  createFeeStructureSlab,
  getAllFeeStructureSlabs,
  getFeeStructureSlabById,
  updateFeeStructureSlab,
  deleteFeeStructureSlab,
} from "../services/fee-structure-slab.service.js";
import { createFeeStructureSlabSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";
import { z } from "zod";

export async function createFeeStructureSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    const parsed = createFeeStructureSlabSchema.parse(req.body);
    const created = await createFeeStructureSlab(parsed);
    if (!created)
      return res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Failed to create fee structure slab",
          ),
        );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Fee structure slab created successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getAllFeeStructureSlabsHandler(
  _req: Request,
  res: Response,
) {
  try {
    const rows = await getAllFeeStructureSlabs();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee structure slabs retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeStructureSlabByIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const row = await getFeeStructureSlabById(id);
    if (!row)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee structure slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Fee structure slab retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeStructureSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const partialSchema = createFeeStructureSlabSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated = await updateFeeStructureSlab(id, parsed);
    if (!updated)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee structure slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee structure slab updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeStructureSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const deleted = await deleteFeeStructureSlab(id);
    if (!deleted)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee structure slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee structure slab deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
