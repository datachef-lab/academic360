import { Request, Response } from "express";
import {
  createFeeCategory,
  getAllFeeCategories,
  getFeeCategoryById,
  updateFeeCategory,
  deleteFeeCategory,
} from "../services/fee-category.service";
import { createFeeCategorySchema } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";

export async function createFeeCategoryHandler(req: Request, res: Response) {
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
    const schemaWithoutAutoFields = createFeeCategorySchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      createdByUserId: true,
      updatedByUserId: true,
    });
    const parsed = schemaWithoutAutoFields.parse(req.body);
    const created = await createFeeCategory(parsed, userId);
    if (!created)
      return res
        .status(500)
        .json(
          new ApiResponse(500, "ERROR", null, "Failed to create fee category"),
        );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Fee category created successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getAllFeeCategoriesHandler(_req: Request, res: Response) {
  try {
    const rows = await getAllFeeCategories();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee categories retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeCategoryByIdHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const row = await getFeeCategoryById(id);
    if (!row)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee category with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Fee category retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeCategoryHandler(req: Request, res: Response) {
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

    const partialSchema = createFeeCategorySchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated = await updateFeeCategory(id, parsed, userId);
    if (!updated)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee category with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee category updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeCategoryHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const deleted = await deleteFeeCategory(id);
    if (!deleted)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee category with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee category deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
