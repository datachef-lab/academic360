import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createSubjectSpecificPassing,
  getSubjectSpecificPassingById,
  getAllSubjectSpecificPassings,
  getSubjectSpecificPassingBySubjectId,
  updateSubjectSpecificPassing,
  deleteSubjectSpecificPassing,
  bulkUploadSubjectSpecificPassings,
} from "@/features/subject-selection/services/subject-specific-passing.service.js";
import { socketService } from "@/services/socketService.js";

export const createSubjectSpecificPassingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const created = await createSubjectSpecificPassing(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Subject specific passing created successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getSubjectSpecificPassingByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const subjectSpecificPassing = await getSubjectSpecificPassingById(
      Number(id),
    );
    if (!subjectSpecificPassing) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject specific passing not found",
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
          subjectSpecificPassing,
          "Subject specific passing retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getAllSubjectSpecificPassingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const subjectSpecificPassings = await getAllSubjectSpecificPassings();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          subjectSpecificPassings,
          "Subject specific passings retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const getSubjectSpecificPassingBySubjectIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { subjectId } = req.params;
    const subjectSpecificPassing = await getSubjectSpecificPassingBySubjectId(
      Number(subjectId),
    );
    if (!subjectSpecificPassing) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject specific passing not found",
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
          subjectSpecificPassing,
          "Subject specific passing retrieved successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const updateSubjectSpecificPassingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updated = await updateSubjectSpecificPassing(Number(id), req.body);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject specific passing not found",
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
          "Subject specific passing updated successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const deleteSubjectSpecificPassingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const deleted = await deleteSubjectSpecificPassing(Number(id));
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Subject specific passing not found",
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
          "Subject specific passing deleted successfully!",
        ),
      );
  } catch (error) {
    console.log(error);
    handleError(error, res, next);
  }
};

export const bulkUploadSubjectSpecificPassingsHandler = async (
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

    const result = await bulkUploadSubjectSpecificPassings(req.file);

    // Emit progress via socket
    const io = socketService.getIO();
    if (io) {
      io.emit("bulk-upload-complete", {
        type: "subject-specific-passing",
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
