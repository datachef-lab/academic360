import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createRestrictedGroupingClass,
  getRestrictedGroupingClassById,
  getAllRestrictedGroupingClasses,
  getRestrictedGroupingClassesByMainId,
  updateRestrictedGroupingClass,
  deleteRestrictedGroupingClass,
  bulkUploadRestrictedGroupingClasses,
} from "@/features/subject-selection/services/restricted-grouping-class.service.js";
import { socketService } from "@/services/socketService.js";

export const createRestrictedGroupingClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const created = await createRestrictedGroupingClass(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Restricted grouping class created successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getRestrictedGroupingClassByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const restrictedGroupingClass = await getRestrictedGroupingClassById(
      Number(id),
    );
    if (!restrictedGroupingClass) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping class not found",
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
          restrictedGroupingClass,
          "Restricted grouping class retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getAllRestrictedGroupingClassesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const restrictedGroupingClasses = await getAllRestrictedGroupingClasses();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          restrictedGroupingClasses,
          "Restricted grouping classes retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getRestrictedGroupingClassesByMainIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { mainId } = req.params;
    const restrictedGroupingClasses =
      await getRestrictedGroupingClassesByMainId(Number(mainId));
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          restrictedGroupingClasses,
          "Restricted grouping classes retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const updateRestrictedGroupingClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updated = await updateRestrictedGroupingClass(Number(id), req.body);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping class not found",
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
          "Restricted grouping class updated successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const deleteRestrictedGroupingClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const deleted = await deleteRestrictedGroupingClass(Number(id));
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Restricted grouping class not found",
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
          "Restricted grouping class deleted successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const bulkUploadRestrictedGroupingClassesHandler = async (
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

    const result = await bulkUploadRestrictedGroupingClasses(req.file);

    // Emit progress via socket
    const io = socketService.getIO();
    if (io) {
      io.emit("bulk-upload-complete", {
        type: "restricted-grouping-class",
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
