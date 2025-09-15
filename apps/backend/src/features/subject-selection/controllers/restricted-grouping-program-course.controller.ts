import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createRestrictedGroupingProgramCourse,
  getRestrictedGroupingProgramCourseById,
  getAllRestrictedGroupingProgramCourses,
  getRestrictedGroupingProgramCoursesByMainId,
  updateRestrictedGroupingProgramCourse,
  deleteRestrictedGroupingProgramCourse,
  bulkUploadRestrictedGroupingProgramCourses,
} from "@/features/subject-selection/services/restricted-grouping-program-course.service.js";
import { socketService } from "@/services/socketService.js";

export const createRestrictedGroupingProgramCourseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const created = await createRestrictedGroupingProgramCourse(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Restricted grouping program course created successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getRestrictedGroupingProgramCourseByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const restrictedGroupingProgramCourse =
      await getRestrictedGroupingProgramCourseById(Number(id));
    if (!restrictedGroupingProgramCourse) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping program course not found",
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
          restrictedGroupingProgramCourse,
          "Restricted grouping program course retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getAllRestrictedGroupingProgramCoursesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const restrictedGroupingProgramCourses =
      await getAllRestrictedGroupingProgramCourses();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          restrictedGroupingProgramCourses,
          "Restricted grouping program courses retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getRestrictedGroupingProgramCoursesByMainIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { mainId } = req.params;
    const restrictedGroupingProgramCourses =
      await getRestrictedGroupingProgramCoursesByMainId(Number(mainId));
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          restrictedGroupingProgramCourses,
          "Restricted grouping program courses retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const updateRestrictedGroupingProgramCourseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updated = await updateRestrictedGroupingProgramCourse(
      Number(id),
      req.body,
    );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping program course not found",
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
          "Restricted grouping program course updated successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const deleteRestrictedGroupingProgramCourseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const deleted = await deleteRestrictedGroupingProgramCourse(Number(id));
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping program course not found",
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
          "Restricted grouping program course deleted successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const bulkUploadRestrictedGroupingProgramCoursesHandler = async (
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

    const result = await bulkUploadRestrictedGroupingProgramCourses(req.file);

    // Emit progress via socket
    const io = socketService.getIO();
    if (io) {
      io.emit("bulk-upload-complete", {
        type: "restricted-grouping-program-course",
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
