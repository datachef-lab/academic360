import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createRestrictedGroupingMainFromDto,
  getRestrictedGroupingMainById,
  getAllRestrictedGroupingMains,
  getRestrictedGroupingMainsPaginated,
  updateRestrictedGroupingMainFromDto,
  deleteRestrictedGroupingMain,
  bulkUploadRestrictedGroupingMains,
} from "@/features/subject-selection/services/restricted-grouping-main.service.js";
import { socketService } from "@/services/socketService.js";

export const createRestrictedGroupingMainHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Enforce DTO-only input
    const body = req.body as any;
    const isDtoShape = body && body.subjectType?.id && body.subject?.id;
    if (!isDtoShape) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Request body must be DTO-shaped: { subjectType: { id }, subject: { id }, ... }",
          ),
        );
      return;
    }
    const created = await createRestrictedGroupingMainFromDto(body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Restricted grouping main created successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getRestrictedGroupingMainByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const restrictedGroupingMain = await getRestrictedGroupingMainById(
      Number(id),
    );
    if (!restrictedGroupingMain) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping main not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          restrictedGroupingMain,
          "Restricted grouping main retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getAllRestrictedGroupingMainsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page = "1",
      pageSize = "10",
      search = "",
      subjectType = "",
      programCourseId,
    } = req.query as Record<string, string>;
    const paged = await getRestrictedGroupingMainsPaginated({
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(pageSize, 10) || 10,
      search: search || undefined,
      subjectType: subjectType || undefined,
      programCourseId: programCourseId ? Number(programCourseId) : undefined,
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          paged,
          "Restricted grouping mains retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const updateRestrictedGroupingMainHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const body = req.body as any;
    // Enforce DTO-only input (allow partial DTO for update, but still nested keys)
    const hasAnyDtoKey =
      body &&
      (body.subjectType?.id ||
        body.subject?.id ||
        Array.isArray(body.forClasses) ||
        Array.isArray(body.cannotCombineWithSubjects) ||
        Array.isArray(body.applicableProgramCourses) ||
        typeof body.isActive === "boolean");
    if (!hasAnyDtoKey) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Update payload must be DTO-shaped. Use nested keys like subjectType.id, subject.id, forClasses[], cannotCombineWithSubjects[], applicableProgramCourses[]",
          ),
        );
      return;
    }
    const updated = await updateRestrictedGroupingMainFromDto(
      Number(id),
      body as any,
    );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping main not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Restricted grouping main updated successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const deleteRestrictedGroupingMainHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const deleted = await deleteRestrictedGroupingMain(Number(id));
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping main not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deleted,
          "Restricted grouping main deleted successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const bulkUploadRestrictedGroupingMainsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "No file uploaded"));
      return;
    }

    const result = await bulkUploadRestrictedGroupingMains(req.file);

    // Emit progress via socket
    const io = socketService.getIO();
    if (io) {
      io.emit("bulk-upload-complete", {
        type: "restricted-grouping-main",
        data: {
          success: result.success.length,
          errors: result.errors.length,
          total: result.success.length + result.errors.length,
        },
      });
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          `Bulk upload completed! ${result.success.length} successful, ${result.errors.length} errors`,
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};
