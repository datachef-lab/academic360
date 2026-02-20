import { Request, Response } from "express";
import {
  createFeeGroupPromotionMapping,
  getAllFeeGroupPromotionMappings,
  getFeeGroupPromotionMappingById,
  getFeeGroupPromotionMappingsByFeeGroupId,
  getFeeGroupPromotionMappingsByPromotionId,
  updateFeeGroupPromotionMapping,
  deleteFeeGroupPromotionMapping,
  getFilteredFeeGroupPromotionMappings,
  FeeGroupPromotionFilter,
  bulkUploadFeeGroupPromotionMappings,
} from "../services/fee-group-promotion-mapping.service.js";
import { createFeeGroupPromotionMappingSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";

export async function createFeeGroupPromotionMappingHandler(
  req: Request,
  res: Response,
) {
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
    const schemaWithoutAutoFields = createFeeGroupPromotionMappingSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      createdByUserId: true,
      updatedByUserId: true,
    });
    const parsed = schemaWithoutAutoFields.parse(req.body);
    const created = await createFeeGroupPromotionMapping(parsed, userId);
    if (!created)
      return res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Failed to create fee group promotion mapping",
          ),
        );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Fee group promotion mapping created successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getAllFeeGroupPromotionMappingsHandler(
  _req: Request,
  res: Response,
) {
  try {
    const rows = await getAllFeeGroupPromotionMappings(
      +String(_req.params.page),
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee group promotion mappings retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeGroupPromotionMappingByIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const row = await getFeeGroupPromotionMappingById(id);
    if (!row)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee group promotion mapping with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Fee group promotion mapping retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeGroupPromotionMappingsByFeeGroupIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const feeGroupId = parseInt(req.params.feeGroupId as string, 10);
    if (Number.isNaN(feeGroupId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid fee group ID format" });

    const rows = await getFeeGroupPromotionMappingsByFeeGroupId(feeGroupId);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee group promotion mappings retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeGroupPromotionMappingsByPromotionIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const promotionId = parseInt(req.params.promotionId as string, 10);
    if (Number.isNaN(promotionId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid promotion ID format" });

    const rows = await getFeeGroupPromotionMappingsByPromotionId(promotionId);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee group promotion mappings retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeGroupPromotionMappingHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

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

    const partialSchema = createFeeGroupPromotionMappingSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated = await updateFeeGroupPromotionMapping(id, parsed, userId);
    if (!updated)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee group promotion mapping with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee group promotion mapping updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeGroupPromotionMappingHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const userId = (req.user as any)?.id;
    const deleted = await deleteFeeGroupPromotionMapping(id, userId);
    if (!deleted)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee group promotion mapping with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee group promotion mapping deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFilteredFeeGroupPromotionMappingsHandler(
  req: Request,
  res: Response,
) {
  try {
    const {
      academicYearId,
      programCourseId,
      classId,
      shiftId,
      religionId,
      categoryId,
      community,
      feeGroupId,
      page,
    } = req.query;

    const parsedFilters: FeeGroupPromotionFilter = {
      academicYearId: academicYearId ? Number(academicYearId) : undefined,
      programCourseId: programCourseId ? Number(programCourseId) : undefined,
      classId: classId ? Number(classId) : undefined,
      shiftId: shiftId ? Number(shiftId) : undefined,
      religionId: religionId ? Number(religionId) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      community: community ? String(community) : undefined,
      feeGroupId: feeGroupId ? Number(feeGroupId) : 0,
    };

    if (!parsedFilters.feeGroupId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "feeGroupId is required for filtered mappings",
          ),
        );
    }

    const result = await getFilteredFeeGroupPromotionMappings(parsedFilters);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Filtered fee group promotion mappings retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function bulkUploadFeeGroupPromotionMappingsHandler(
  req: Request,
  res: Response,
) {
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

    if (!req.file || !req.file.path) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "No file uploaded"));
    }

    const uploadSessionId =
      req.body.uploadSessionId || req.query.uploadSessionId;

    const result = await bulkUploadFeeGroupPromotionMappings(
      req.file.path,
      userId,
      uploadSessionId,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          `Bulk upload completed. ${result.summary.successful} successful, ${result.summary.failed} failed.`,
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
