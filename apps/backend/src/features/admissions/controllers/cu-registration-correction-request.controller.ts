import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { db } from "@/db/index.js";
import { studentModel } from "@repo/db/schemas/models/user";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import { ilike, eq } from "drizzle-orm";
import { cuRegistrationCorrectionRequestInsertSchema } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import {
  createCuRegistrationCorrectionRequest,
  findCuRegistrationCorrectionRequestById,
  findAllCuRegistrationCorrectionRequests,
  findCuRegistrationCorrectionRequestsByStudentId,
  findCuRegistrationCorrectionRequestsByStudentUid,
  updateCuRegistrationCorrectionRequest,
  deleteCuRegistrationCorrectionRequest,
  findCuRegistrationCorrectionRequestsByStatus,
  getNextCuRegistrationApplicationNumber,
  validateCuRegistrationApplicationNumber,
  getCuRegistrationApplicationNumberStats,
  exportCuRegistrationCorrectionRequests,
  markPhysicalRegistrationDone,
} from "../services/cu-registration-correction-request.service.js";
import { AdmRegFormService } from "../services/adm-reg-form.service.js";
import { getCuRegPdfPathDynamic } from "../services/cu-registration-document-path.service.js";
import { getSignedUrlForFile } from "@/services/s3.service.js";
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
import { UserDto } from "@repo/db/index.js";

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

    console.info("[CU-REG CONTROLLER] Update data with payload and flags:", {
      id,
      dbFields,
      payload,
      flags,
    });

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
      req.user as UserDto,
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
// export const approveCuRegistrationCorrectionRequestById = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const id = parseInt(req.params.id);
//     const { approvedBy, approvedRemarks } = req.body;

//     if (isNaN(id)) {
//       res.status(400).json(new ApiError(400, "Invalid request ID"));
//       return;
//     }

//     if (!approvedBy || typeof approvedBy !== "number") {
//       res
//         .status(400)
//         .json(new ApiError(400, "Approved by user ID is required"));
//       return;
//     }

//     // const updatedRequest = await approveCuRegistrationCorrectionRequest(
//     //   id,
//     //   approvedBy,
//     //   approvedRemarks,
//     // );

//     if (!updatedRequest) {
//       res
//         .status(404)
//         .json(
//           new ApiError(404, "CU registration correction request not found"),
//         );
//       return;
//     }

//     res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           "SUCCESS",
//           updatedRequest,
//           "CU registration correction request approved successfully!",
//         ),
//       );
//   } catch (error) {
//     handleError(error, res, next);
//   }
// };

// // Reject CU registration correction request
// export const rejectCuRegistrationCorrectionRequestById = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const id = parseInt(req.params.id);
//     const { rejectedBy, rejectedRemarks } = req.body;

//     if (isNaN(id)) {
//       res.status(400).json(new ApiError(400, "Invalid request ID"));
//       return;
//     }

//     if (!rejectedBy || typeof rejectedBy !== "number") {
//       res
//         .status(400)
//         .json(new ApiError(400, "Rejected by user ID is required"));
//       return;
//     }

//     const updatedRequest = await rejectCuRegistrationCorrectionRequest(
//       id,
//       rejectedBy,
//       rejectedRemarks,
//     );

//     if (!updatedRequest) {
//       res
//         .status(404)
//         .json(
//           new ApiError(404, "CU registration correction request not found"),
//         );
//       return;
//     }

//     res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           "SUCCESS",
//           updatedRequest,
//           "CU registration correction request rejected successfully!",
//         ),
//       );
//   } catch (error) {
//     handleError(error, res, next);
//   }
// };

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

// Export CU Registration Correction Requests to Excel
export const exportCuRegistrationCorrectionRequestsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("🔍 [CU-REG-EXPORT-CONTROLLER] Starting export request");

    // Generate Excel buffer
    const excelBuffer = await exportCuRegistrationCorrectionRequests();

    // Set response headers for Excel download
    const filename = `cu-registration-corrections-${new Date().toISOString().split("T")[0]}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", excelBuffer.length);

    // Send the Excel buffer
    res.send(excelBuffer);

    console.log(
      "✅ [CU-REG-EXPORT-CONTROLLER] Excel export completed successfully",
    );
  } catch (error) {
    console.error(
      "❌ [CU-REG-EXPORT-CONTROLLER] Error in export controller:",
      error,
    );
    handleError(error, res, next);
  }
};

// Admin/Staff Personal Info Update Endpoint
export const updatePersonalInfoByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { personalInfo, flags } = req.body;

    console.info("[CU-REG ADMIN] Personal info update - incoming", {
      correctionRequestId: id,
      personalInfo,
      flags,
      hasFullName: !!personalInfo?.fullName,
      hasFatherMotherName: !!personalInfo?.fatherMotherName,
      fatherMotherNameValue: personalInfo?.fatherMotherName,
      fullNameValue: personalInfo?.fullName,
    });

    if (!id) {
      res
        .status(400)
        .json(new ApiError(400, "Correction request ID is required"));
      return;
    }

    // Get the correction request
    const correctionRequest = await findCuRegistrationCorrectionRequestById(
      parseInt(id),
    );
    if (!correctionRequest) {
      res.status(404).json(new ApiError(404, "Correction request not found"));
      return;
    }

    if (!correctionRequest.student?.id) {
      res
        .status(400)
        .json(
          new ApiError(400, "Student not found for this correction request"),
        );
      return;
    }

    // Update the correction request with admin changes
    const updatedRequest = await updateCuRegistrationCorrectionRequest(
      parseInt(id),
      {
        personalInfoDeclaration: true,
        genderCorrectionRequest: flags?.gender || false,
        nationalityCorrectionRequest: flags?.nationality || false,
        aadhaarCardNumberCorrectionRequest: flags?.aadhaarNumber || false,
        apaarIdCorrectionRequest: flags?.apaarId || false,
        // Pass the payload to update personal info and student data
        payload: { personalInfo },
      } as any,
      req.user as UserDto,
    );

    console.info("[CU-REG ADMIN] Personal info update - request updated", {
      id,
      status: updatedRequest?.status,
      personalInfoDeclaration: (updatedRequest as any)?.personalInfoDeclaration,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { correctionRequest: updatedRequest },
          "Personal information updated successfully by admin!",
        ),
      );
  } catch (error) {
    console.error("[CU-REG ADMIN] Personal info update error:", error);
    handleError(error, res, next);
  }
};

// Admin/Staff Address Info Update Endpoint
export const updateAddressInfoByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { addressData } = req.body;

    console.info("[CU-REG ADMIN] Address info update - incoming", {
      correctionRequestId: id,
      addressData,
    });

    if (!id) {
      res
        .status(400)
        .json(new ApiError(400, "Correction request ID is required"));
      return;
    }

    // Get the correction request
    const correctionRequest = await findCuRegistrationCorrectionRequestById(
      parseInt(id),
    );
    if (!correctionRequest) {
      res.status(404).json(new ApiError(404, "Correction request not found"));
      return;
    }

    if (!correctionRequest.student?.id) {
      res
        .status(400)
        .json(
          new ApiError(400, "Student not found for this correction request"),
        );
      return;
    }

    const user = req.user as UserDto;

    // Update the correction request with admin changes
    const updatedRequest = await updateCuRegistrationCorrectionRequest(
      parseInt(id),
      {
        addressInfoDeclaration: true,
        // Pass the payload to update address data
        payload: { addressData },
      } as any,
      user,
    );

    console.info("[CU-REG ADMIN] Address info update - request updated", {
      id,
      status: updatedRequest?.status,
      addressInfoDeclaration: (updatedRequest as any)?.addressInfoDeclaration,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { correctionRequest: updatedRequest },
          "Address information updated successfully by admin!",
        ),
      );
  } catch (error) {
    console.error("[CU-REG ADMIN] Address info update error:", error);
    handleError(error, res, next);
  }
};

// Get CU registration correction requests by student UID
export const getCuRegistrationCorrectionRequestsByStudentUid = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentUid } = req.params;

    if (!studentUid) {
      res.status(400).json(new ApiError(400, "Student UID is required"));
      return;
    }

    const requests =
      await findCuRegistrationCorrectionRequestsByStudentUid(studentUid);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          requests,
          "CU registration correction requests retrieved successfully by student UID!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Mark physical registration as done
export const markPhysicalRegistrationDoneController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const correctionRequestId = parseInt(id);
    const user = req.user as UserDto;

    if (isNaN(correctionRequestId)) {
      res.status(400).json(new ApiError(400, "Invalid correction request ID"));
      return;
    }

    const updatedRequest = await markPhysicalRegistrationDone(
      correctionRequestId,
      user?.id,
    );

    if (!updatedRequest) {
      res.status(404).json(new ApiError(404, "Correction request not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { correctionRequest: updatedRequest },
          "Physical registration marked as done successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get CU Registration PDF by encoded application number (for WhatsApp redirect)
export const getCuRegistrationPdfByApplicationNumber = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { encodedApplicationNumber } = req.params;

    if (!encodedApplicationNumber) {
      res
        .status(400)
        .json(new ApiError(400, "Encoded application number is required"));
      return;
    }

    // Decode the application number
    const admRegFormService = new AdmRegFormService();
    let applicationNumber: string;

    try {
      applicationNumber = admRegFormService.decodeApplicationNumber(
        encodedApplicationNumber,
      );
    } catch (error) {
      res
        .status(400)
        .json(new ApiError(400, "Invalid encoded application number"));
      return;
    }

    console.info(
      `[CU-REG PDF] Decoded application number: ${applicationNumber}`,
    );

    // Find the correction request by application number
    const [correctionRequest] = await db
      .select({
        id: cuRegistrationCorrectionRequestModel.id,
        studentId: cuRegistrationCorrectionRequestModel.studentId,
        cuRegistrationApplicationNumber:
          cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
      })
      .from(cuRegistrationCorrectionRequestModel)
      .where(
        eq(
          cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
          applicationNumber,
        ),
      )
      .limit(1);

    if (!correctionRequest) {
      res.status(404).json(new ApiError(404, "CU registration form not found"));
      return;
    }

    // Get student UID
    const [student] = await db
      .select({ uid: studentModel.uid })
      .from(studentModel)
      .where(eq(studentModel.id, correctionRequest.studentId))
      .limit(1);

    if (!student?.uid) {
      res.status(404).json(new ApiError(404, "Student UID not found"));
      return;
    }

    // Generate PDF path
    const pdfPathConfig = await getCuRegPdfPathDynamic(
      correctionRequest.studentId,
      student.uid,
      applicationNumber,
    );

    console.info(`[CU-REG PDF] Generated PDF path: ${pdfPathConfig.fullPath}`);

    // Generate pre-signed URL for the PDF (expires in 1 hour)
    const signedUrl = await getSignedUrlForFile(pdfPathConfig.fullPath, 3600); // 1 hour expiry

    if (!signedUrl) {
      res.status(404).json(new ApiError(404, "PDF file not found in storage"));
      return;
    }

    console.info(
      `[CU-REG PDF] Generated signed URL for application number: ${applicationNumber}`,
    );

    // Redirect to the signed URL
    res.redirect(302, signedUrl);
  } catch (error) {
    console.error("[CU-REG PDF] Error generating PDF access:", error);
    handleError(error, res, next);
  }
};
