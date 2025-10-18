import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { cuRegistrationCorrectionRequestInsertSchema } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import {
  createCuRegistrationCorrectionRequest,
  findCuRegistrationCorrectionRequestById,
  findAllCuRegistrationCorrectionRequests,
  findCuRegistrationCorrectionRequestsByStudentId,
  updateCuRegistrationCorrectionRequest,
  approveCuRegistrationCorrectionRequest,
  rejectCuRegistrationCorrectionRequest,
  deleteCuRegistrationCorrectionRequest,
  findCuRegistrationCorrectionRequestsByStatus,
  getNextCuRegistrationApplicationNumber,
  validateCuRegistrationApplicationNumber,
  getCuRegistrationApplicationNumberStats,
} from "../services/cu-registration-correction-request.service.js";
import {
  uploadToS3,
  deleteFromS3,
  createStudentUploadConfig,
  FileTypeConfigs,
} from "@/services/s3.service.js";
import {
  uploadToFileSystem,
  deleteFromFileSystem,
} from "@/services/filesystem-storage.service.js";
import { createCuRegistrationDocumentUpload } from "../services/cu-registration-document-upload.service.js";
import multer from "multer";

// Create a new CU registration correction request
export const createNewCuRegistrationCorrectionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Validate request body
    const parseResult = cuRegistrationCorrectionRequestInsertSchema.safeParse(
      req.body,
    );
    if (!parseResult.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parseResult.error.flatten()),
          ),
        );
      return;
    }

    const newRequest = await createCuRegistrationCorrectionRequest(
      parseResult.data,
    );

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newRequest,
          "CU registration correction request created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all CU registration correction requests with pagination and filters
export const getAllCuRegistrationCorrectionRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const studentId = req.query.studentId
      ? parseInt(req.query.studentId as string)
      : undefined;
    const search = req.query.search as string;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100",
          ),
        );
      return;
    }

    const result = await findAllCuRegistrationCorrectionRequests(
      page,
      limit,
      status,
      studentId,
      search,
    );

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          ...result,
          currentPage: page,
          hasNextPage: page < result.totalPages,
          hasPrevPage: page > 1,
        },
        "CU registration correction requests retrieved successfully!",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get CU registration correction request by ID
export const getCuRegistrationCorrectionRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid request ID"));
      return;
    }

    const request = await findCuRegistrationCorrectionRequestById(id);

    if (!request) {
      res
        .status(404)
        .json(
          new ApiError(404, "CU registration correction request not found"),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          request,
          "CU registration correction request retrieved successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get CU registration correction requests by student ID
export const getCuRegistrationCorrectionRequestsByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentId = parseInt(req.params.studentId);

    if (isNaN(studentId)) {
      res.status(400).json(new ApiError(400, "Invalid student ID"));
      return;
    }

    const requests =
      await findCuRegistrationCorrectionRequestsByStudentId(studentId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          requests,
          "CU registration correction requests retrieved successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get CU registration correction requests by status
export const getCuRegistrationCorrectionRequestsByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const status = req.params.status;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate status
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          ),
        );
      return;
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100",
          ),
        );
      return;
    }

    const result = await findCuRegistrationCorrectionRequestsByStatus(
      status,
      page,
      limit,
    );

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          ...result,
          currentPage: page,
          hasNextPage: page < result.totalPages,
          hasPrevPage: page > 1,
        },
        "CU registration correction requests retrieved successfully!",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update CU registration correction request
export const updateCuRegistrationCorrectionRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid request ID"));
      return;
    }

    // Extract payload and flags separately as they're not part of the database schema
    const { payload, flags, ...dbFields } = req.body;

    // Validate request body (excluding payload and flags)
    const parseResult = cuRegistrationCorrectionRequestInsertSchema
      .partial()
      .safeParse(dbFields);
    if (!parseResult.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parseResult.error.flatten()),
          ),
        );
      return;
    }

    // Add payload and flags back to the data if they exist
    const updateData = {
      ...parseResult.data,
      ...(payload && { payload }),
      ...(flags && { flags }),
    };

    console.info("[CU-REG CONTROLLER] Update data with payload and flags:", {
      id,
      dbFields: parseResult.data,
      payload,
      flags,
    });

    const updatedRequest = await updateCuRegistrationCorrectionRequest(
      id,
      updateData,
    );

    if (!updatedRequest) {
      res
        .status(404)
        .json(
          new ApiError(404, "CU registration correction request not found"),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedRequest,
          "CU registration correction request updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Approve CU registration correction request
export const approveCuRegistrationCorrectionRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { approvedBy, approvedRemarks } = req.body;

    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid request ID"));
      return;
    }

    if (!approvedBy || typeof approvedBy !== "number") {
      res
        .status(400)
        .json(new ApiError(400, "Approved by user ID is required"));
      return;
    }

    const updatedRequest = await approveCuRegistrationCorrectionRequest(
      id,
      approvedBy,
      approvedRemarks,
    );

    if (!updatedRequest) {
      res
        .status(404)
        .json(
          new ApiError(404, "CU registration correction request not found"),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedRequest,
          "CU registration correction request approved successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Reject CU registration correction request
export const rejectCuRegistrationCorrectionRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { rejectedBy, rejectedRemarks } = req.body;

    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid request ID"));
      return;
    }

    if (!rejectedBy || typeof rejectedBy !== "number") {
      res
        .status(400)
        .json(new ApiError(400, "Rejected by user ID is required"));
      return;
    }

    const updatedRequest = await rejectCuRegistrationCorrectionRequest(
      id,
      rejectedBy,
      rejectedRemarks,
    );

    if (!updatedRequest) {
      res
        .status(404)
        .json(
          new ApiError(404, "CU registration correction request not found"),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedRequest,
          "CU registration correction request rejected successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete CU registration correction request
export const deleteCuRegistrationCorrectionRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid request ID"));
      return;
    }

    const deleted = await deleteCuRegistrationCorrectionRequest(id);

    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiError(404, "CU registration correction request not found"),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "CU registration correction request deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get next available CU Registration Application Number
export const getNextCuRegistrationApplicationNumberController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const nextNumber = await getNextCuRegistrationApplicationNumber();

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          nextApplicationNumber: nextNumber,
        },
        "Next CU Registration Application Number retrieved successfully!",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Validate CU Registration Application Number
export const validateCuRegistrationApplicationNumberController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { applicationNumber } = req.body;

    if (!applicationNumber) {
      res.status(400).json(new ApiError(400, "Application number is required"));
      return;
    }

    const validation =
      await validateCuRegistrationApplicationNumber(applicationNumber);

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          applicationNumber,
          ...validation,
        },
        "CU Registration Application Number validation completed!",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get CU Registration Application Number statistics
export const getCuRegistrationApplicationNumberStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await getCuRegistrationApplicationNumberStats();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          stats,
          "CU Registration Application Number statistics retrieved successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
