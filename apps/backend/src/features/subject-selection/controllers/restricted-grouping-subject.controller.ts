import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createRestrictedGroupingSubject,
  getRestrictedGroupingSubjectById,
  getAllRestrictedGroupingSubjects,
  getRestrictedGroupingSubjectsByMainId,
  updateRestrictedGroupingSubject,
  deleteRestrictedGroupingSubject,
  bulkUploadRestrictedGroupingSubjects,
} from "@/features/subject-selection/services/restricted-grouping-subject.service.js";
import { socketService } from "@/services/socketService.js";

export const createRestrictedGroupingSubjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const created = await createRestrictedGroupingSubject(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Restricted grouping subject created successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getRestrictedGroupingSubjectByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const restrictedGroupingSubject = await getRestrictedGroupingSubjectById(
      Number(id),
    );
    if (!restrictedGroupingSubject) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping subject not found",
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
          restrictedGroupingSubject,
          "Restricted grouping subject retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getAllRestrictedGroupingSubjectsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const restrictedGroupingSubjects = await getAllRestrictedGroupingSubjects();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          restrictedGroupingSubjects,
          "Restricted grouping subjects retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getRestrictedGroupingSubjectsByMainIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { mainId } = req.params;
    const restrictedGroupingSubjects =
      await getRestrictedGroupingSubjectsByMainId(Number(mainId));
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          restrictedGroupingSubjects,
          "Restricted grouping subjects retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const updateRestrictedGroupingSubjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updated = await updateRestrictedGroupingSubject(Number(id), req.body);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping subject not found",
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
          "Restricted grouping subject updated successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const deleteRestrictedGroupingSubjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const deleted = await deleteRestrictedGroupingSubject(Number(id));
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping subject not found",
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
          "Restricted grouping subject deleted successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const bulkUploadRestrictedGroupingSubjectsHandler = async (
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

    const result = await bulkUploadRestrictedGroupingSubjects(req.file);

    // Emit progress via socket
    const io = socketService.getIO();
    if (io) {
      io.emit("bulk-upload-complete", {
        type: "restricted-grouping-subject",
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
