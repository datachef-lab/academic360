import { Request, Response } from "express";
import {
  createFeeStudentMapping,
  getAllFeeStudentMappings,
  getFeeStudentMappingById,
  getFeeStudentMappingsByStudentId,
  updateFeeStudentMapping,
  deleteFeeStudentMapping,
} from "../services/fee-student-mapping.service";
import { createFeeStudentMappingSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";
import { z } from "zod";

export async function createFeeStudentMappingHandler(
  req: Request,
  res: Response,
) {
  try {
<<<<<<<< HEAD:apps/backend/src/features/fees/controllers/fee-student-mapping.controller.ts
    const parsed = createFeeStudentMappingSchema.parse(req.body);
    const created = await createFeeStudentMapping(parsed);
    if (!created)
========
    const userId = (req.user as any)?.id;
    if (!userId) {
>>>>>>>> ea5bf55f9 (update fee module):apps/backend/src/features/fees/controllers/fee-concession-slab.controller.ts
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            "UNAUTHORIZED",
            null,
<<<<<<<< HEAD:apps/backend/src/features/fees/controllers/fee-student-mapping.controller.ts
            "Failed to create fee student mapping",
========
            "User authentication required",
>>>>>>>> ea5bf55f9 (update fee module):apps/backend/src/features/fees/controllers/fee-concession-slab.controller.ts
          ),
        );
    }

<<<<<<<< HEAD:apps/backend/src/features/fees/controllers/fee-student-mapping.controller.ts
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Fee student mapping created successfully",
        ),
      );
  } catch (error) {
========
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User ID:", userId);

    // Validate input - create a schema that only includes fields from frontend
    const createSchema = z.object({
      name: z.string().min(1, "Name is required").max(255),
      description: z.string().max(500), // Allow empty string, just validate max length
      defaultConcessionRate: z.number().min(0).max(100).default(0),
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
      const created = await createFeeConcessionSlab(parsed, userId);
      console.log("Created slab:", created);

      if (!created) {
        console.error(
          "Failed to create fee concession slab - service returned null",
        );
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
      }

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
    } catch (dbError: any) {
      console.error("Database error creating fee concession slab:", dbError);
      console.error("Error code:", dbError?.code);
      console.error("Error message:", dbError?.message);
      console.error("Error stack:", dbError?.stack);
      // Re-throw to be caught by outer catch
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error creating fee concession slab:", error);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error stack:", error?.stack);
    // Zod validation error yields a 400
    // handleError will map and respond accordingly
>>>>>>>> ea5bf55f9 (update fee module):apps/backend/src/features/fees/controllers/fee-concession-slab.controller.ts
    return handleError(error, res);
  }
}

export async function getAllFeeStudentMappingsHandler(
  _req: Request,
  res: Response,
) {
  try {
    const rows = await getAllFeeStudentMappings();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee student mappings retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeStudentMappingByIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const row = await getFeeStudentMappingById(id);
    if (!row)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee student mapping with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Fee student mapping retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeStudentMappingsByStudentIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const studentId = parseInt(req.params.studentId as string, 10);
    if (Number.isNaN(studentId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid student ID format" });

    const rows = await getFeeStudentMappingsByStudentId(studentId);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee student mappings retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

function convertDates(obj: Record<string, any>) {
  const dateFields = [
    "waivedOffDate",
    "transactionDate",
    "createdAt",
    "updatedAt",
  ];
  for (const f of dateFields) {
    if (obj[f] && typeof obj[f] === "string") {
      obj[f] = new Date(obj[f]);
    }
  }
}

export async function updateFeeStudentMappingHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    // Convert date strings to Date objects before validation
    convertDates(req.body);

    const partialSchema = createFeeStudentMappingSchema.partial();
    const parsed = partialSchema.parse(req.body);

<<<<<<<< HEAD:apps/backend/src/features/fees/controllers/fee-student-mapping.controller.ts
    const updated = await updateFeeStudentMapping(id, parsed);
========
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

    const updated = await updateFeeConcessionSlab(id, parsed, userId);
>>>>>>>> ea5bf55f9 (update fee module):apps/backend/src/features/fees/controllers/fee-concession-slab.controller.ts
    if (!updated)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee student mapping with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee student mapping updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeStudentMappingHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const deleted = await deleteFeeStudentMapping(id);
    if (!deleted)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee student mapping with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee student mapping deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
