import { Request, Response } from "express";
import {
  createFeeConcessionSlab,
  getAllFeeConcessionSlabs,
  getFeeConcessionSlabById,
  updateFeeConcessionSlab,
  deleteFeeConcessionSlab,
} from "../services/fee-concession-slab.service";
import { createFeeConcessionSlabSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";

export async function createFeeConcessionSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    // Validate input
    const parsed = createFeeConcessionSlabSchema.parse(req.body);

    const created = await createFeeConcessionSlab(parsed);

    if (!created)
      return res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Failed to create fee concession slab",
          ),
        );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Fee concession slab created successfully",
        ),
      );
  } catch (error) {
    // Zod validation error yields a 400
    // handleError will map and respond accordingly
    return handleError(error, res);
  }
}

export async function getAllFeeConcessionSlabsHandler(
  _req: Request,
  res: Response,
) {
  try {
    const slabs = await getAllFeeConcessionSlabs();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          slabs,
          "Fee concession slabs retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeConcessionSlabByIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const slab = await getFeeConcessionSlabById(id);
    if (!slab)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee concession slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          slab,
          "Fee concession slab retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeConcessionSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    // Validate partial payload
    const partialSchema = createFeeConcessionSlabSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated = await updateFeeConcessionSlab(id, parsed);
    if (!updated)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee concession slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee concession slab updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeConcessionSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const deleted = await deleteFeeConcessionSlab(id);
    if (!deleted)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee concession slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee concession slab deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
