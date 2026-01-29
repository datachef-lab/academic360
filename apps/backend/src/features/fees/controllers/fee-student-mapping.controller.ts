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

export async function createFeeStudentMappingHandler(
  req: Request,
  res: Response,
) {
  try {
    const parsed = createFeeStudentMappingSchema.parse(req.body);
    const created = await createFeeStudentMapping(parsed);
    if (!created)
      return res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Failed to create fee student mapping",
          ),
        );

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
    const id = parseInt(req.params.id, 10);
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
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    // Convert date strings to Date objects before validation
    convertDates(req.body);

    const partialSchema = createFeeStudentMappingSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated = await updateFeeStudentMapping(id, parsed);
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
    const id = parseInt(req.params.id, 10);
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
