import { Request, Response } from "express";
import {
  createFeeGroup,
  getAllFeeGroups,
  getFeeGroupById,
  updateFeeGroup,
  deleteFeeGroup,
} from "../services/fee-group.service.js";
import { createFeeGroupSchema, feeGroupModel } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";
import { db } from "@/db";
import { eq } from "drizzle-orm";

export async function createFeeGroupHandler(req: Request, res: Response) {
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

    const schemaWithoutAutoFields = createFeeGroupSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      createdByUserId: true,
      updatedByUserId: true,
    });
    const parsed = schemaWithoutAutoFields.parse(req.body);
    const created = await createFeeGroup(parsed, userId);
    if (!created) {
      // Check if it's a duplicate slab or duplicate combination
      const existingSlab = await db
        .select()
        .from(feeGroupModel)
        .where(eq(feeGroupModel.feeSlabId, parsed.feeSlabId))
        .limit(1);
      const message =
        existingSlab.length > 0
          ? "This Fee Slab is already used in another fee group. Each Fee Slab can only be used once."
          : "A fee group with this fee category and fee slab combination already exists";
      return res
        .status(409)
        .json(new ApiResponse(409, "CONFLICT", null, message));
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Fee group created successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getAllFeeGroupsHandler(_req: Request, res: Response) {
  try {
    const rows = await getAllFeeGroups();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee groups retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeGroupByIdHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const row = await getFeeGroupById(id);
    if (!row)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee group with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Fee group retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeGroupHandler(req: Request, res: Response) {
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

    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const partialSchema = createFeeGroupSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated = await updateFeeGroup(id, parsed, userId);
    if (!updated) {
      // Check if it's a duplicate or not found
      const existing = await getFeeGroupById(id);
      if (!existing) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              "NOT_FOUND",
              null,
              `Fee group with ID ${id} not found`,
            ),
          );
      }
      // If it exists but update returned null, it's a duplicate
      // Check if it's a duplicate slab or duplicate combination
      let message =
        "A fee group with this fee category and fee slab combination already exists";
      if (parsed.feeSlabId !== undefined) {
        const existingSlab = await db
          .select()
          .from(feeGroupModel)
          .where(eq(feeGroupModel.feeSlabId, parsed.feeSlabId))
          .limit(2);
        if (existingSlab.length >= 2) {
          message =
            "This Fee Slab is already used in another fee group. Each Fee Slab can only be used once.";
        }
      }
      return res
        .status(409)
        .json(new ApiResponse(409, "CONFLICT", null, message));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee group updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeGroupHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const deleted = await deleteFeeGroup(id);
    if (!deleted)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee group with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee group deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
