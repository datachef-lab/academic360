import { Request, Response } from "express";
import {
  createFeeHead,
  getAllFeeHeads,
  getFeeHeadById,
  updateFeeHead,
  deleteFeeHead,
} from "../services/fee-head.service";
import { createFeeHeadSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";

export async function createFeeHeadHandler(req: Request, res: Response) {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            "UNAUTHORIZED",
            null,
            "User authentication required",
          ),
        );
    }

    // Validate input - exclude auto-generated fields and user ID fields
    const schemaWithoutAutoFields = createFeeHeadSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      createdByUserId: true,
      updatedByUserId: true,
    });
    const parsed = schemaWithoutAutoFields.parse(req.body);
    const created = await createFeeHead(parsed, userId);
    if (!created)
      return res
        .status(500)
        .json(new ApiResponse(500, "ERROR", null, "Failed to create fee head"));

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Fee head created successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getAllFeeHeadsHandler(_req: Request, res: Response) {
  try {
    const rows = await getAllFeeHeads();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee heads retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeHeadByIdHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const row = await getFeeHeadById(id);
    if (!row)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee head with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Fee head retrieved successfully"),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeHeadHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const partialSchema = createFeeHeadSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const userId = (req.user as any)?.id;
    if (!userId) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            "UNAUTHORIZED",
            null,
            "User authentication required",
          ),
        );
    }

    const updated = await updateFeeHead(id, parsed, userId);
    if (!updated)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee head with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee head updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeHeadHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const userId = (req.user as any)?.id;
    const deleted = await deleteFeeHead(id, userId);
    if (!deleted)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee head with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee head deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
