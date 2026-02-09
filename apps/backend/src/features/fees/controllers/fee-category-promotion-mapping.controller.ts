import { Request, Response } from "express";
import {
  createFeeCategoryPromotionMapping,
  getAllFeeCategoryPromotionMappings,
  getFeeCategoryPromotionMappingById,
  getFeeCategoryPromotionMappingsByFeeCategoryId,
  getFeeCategoryPromotionMappingsByPromotionId,
  updateFeeCategoryPromotionMapping,
  deleteFeeCategoryPromotionMapping,
  getFilteredFeeCategoryPromotionMappings,
  FeeCategoryPromotionFilter,
  bulkUploadFeeCategoryPromotionMappings,
} from "../services/fee-category-promotion-mapping.service";
import { createFeeGroupPromotionMappingSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";

export async function createFeeCategoryPromotionMappingHandler(
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
    const created = await createFeeCategoryPromotionMapping(parsed, userId);
    if (!created)
      return res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Failed to create fee category promotion mapping",
          ),
        );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Fee category promotion mapping created successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getAllFeeCategoryPromotionMappingsHandler(
  _req: Request,
  res: Response,
) {
  try {
    const rows = await getAllFeeCategoryPromotionMappings();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee category promotion mappings retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeCategoryPromotionMappingByIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const row = await getFeeCategoryPromotionMappingById(id);
    if (!row)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee category promotion mapping with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Fee category promotion mapping retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeCategoryPromotionMappingsByFeeCategoryIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const feeCategoryId = parseInt(req.params.feeCategoryId as string, 10);
    if (Number.isNaN(feeCategoryId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid fee category ID format" });

    const rows =
      await getFeeCategoryPromotionMappingsByFeeCategoryId(feeCategoryId);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee category promotion mappings retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeCategoryPromotionMappingsByPromotionIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const promotionId = parseInt(req.params.promotionId as string, 10);
    if (Number.isNaN(promotionId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid promotion ID format" });

    const rows =
      await getFeeCategoryPromotionMappingsByPromotionId(promotionId);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee category promotion mappings retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeCategoryPromotionMappingHandler(
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

    const updated = await updateFeeCategoryPromotionMapping(id, parsed, userId);
    if (!updated)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee category promotion mapping with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee category promotion mapping updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeCategoryPromotionMappingHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const deleted = await deleteFeeCategoryPromotionMapping(id);
    if (!deleted)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee category promotion mapping with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee category promotion mapping deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFilteredFeeCategoryPromotionMappingsHandler(
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
      feeCategoryId,
    } = req.query;

    const parsedFilters: FeeCategoryPromotionFilter = {
      academicYearId: academicYearId ? Number(academicYearId) : undefined,
      programCourseId: programCourseId ? Number(programCourseId) : undefined,
      classId: classId ? Number(classId) : undefined,
      shiftId: shiftId ? Number(shiftId) : undefined,
      religionId: religionId ? Number(religionId) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      community: community ? String(community) : undefined,
      feeCategoryId: feeCategoryId ? Number(feeCategoryId) : 0,
    };

    if (!parsedFilters.feeCategoryId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "feeCategoryId is required for filtered mappings",
          ),
        );
    }

    const result = await getFilteredFeeCategoryPromotionMappings(parsedFilters);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Filtered fee category promotion mappings retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function bulkUploadFeeCategoryPromotionMappingsHandler(
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

    const result = await bulkUploadFeeCategoryPromotionMappings(
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
