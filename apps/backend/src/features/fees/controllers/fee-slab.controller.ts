import { Request, Response } from "express";
import {
  createFeeSlab,
  getAllFeeSlabs,
  getFeeSlabById,
  updateFeeSlab,
  deleteFeeSlab,
} from "../services/fee-slab.service.js";
import { createFeeSlabSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";
import { z } from "zod";

export async function createFeeSlabHandler(req: Request, res: Response) {
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

    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User ID:", userId);

    // Validate input - create a schema that only includes fields from frontend
    const createSchema = z.object({
      name: z.string().min(1, "Name is required").max(255),
      description: z.string().max(500).nullable().optional(), // Allow null, undefined, or empty string
      defaultRate: z.number().min(0).max(100).default(0),
      sequence: z.number().int().nullable().optional(),
      legacyFeeSlabId: z.number().int().nullable().optional(),
    });

    let parsed;
    try {
      parsed = createSchema.parse(req.body);
      console.log("Parsed data:", JSON.stringify(parsed, null, 2));
    } catch (validationError: any) {
      console.error("Validation error:", validationError);
      if (validationError.errors) {
        console.error(
          "Validation error details:",
          JSON.stringify(validationError.errors, null, 2),
        );
      }
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            validationError.errors?.[0]?.message ||
              validationError.message ||
              "Invalid input data",
          ),
        );
    }

    try {
      const created = await createFeeSlab(parsed, userId);
      console.log("Created slab:", created);

      if (!created) {
        console.error("Failed to create fee slab - service returned null");
        return res
          .status(500)
          .json(
            new ApiResponse(500, "ERROR", null, "Failed to create fee slab"),
          );
      }

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            "SUCCESS",
            created,
            "Fee slab created successfully",
          ),
        );
    } catch (dbError: any) {
      console.error("Database error creating fee slab:", dbError);
      console.error("Error code:", dbError?.code);
      console.error("Error message:", dbError?.message);
      console.error("Error stack:", dbError?.stack);
      // Re-throw to be caught by outer catch
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error creating fee slab:", error);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error stack:", error?.stack);
    // Zod validation error yields a 400
    // handleError will map and respond accordingly
    return handleError(error, res);
  }
}

export async function getAllFeeSlabsHandler(_req: Request, res: Response) {
  try {
    const slabs = await getAllFeeSlabs();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          slabs,
          "Fee slabs retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeSlabByIdHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const slab = await getFeeSlabById(id);
    if (!slab)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          slab,
          "Fee slab retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeSlabHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    // Validate partial payload
    const partialSchema = createFeeSlabSchema.partial();
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

    const updated = await updateFeeSlab(id, parsed, userId);
    if (!updated)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee slab updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeSlabHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const userId = (req.user as any)?.id;
    const deleted = await deleteFeeSlab(id, userId);
    if (!deleted)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee slab deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
