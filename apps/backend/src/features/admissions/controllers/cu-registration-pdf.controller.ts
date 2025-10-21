import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { db } from "@/db/index.js";
import {
  cuRegistrationCorrectionRequestModel,
  studentModel,
  promotionModel,
  sessionModel,
  academicYearModel,
  programCourseModel,
  regulationTypeModel,
} from "@repo/db/schemas";
import { eq } from "drizzle-orm";
import { getCuRegPdfPathDynamic } from "../services/cu-registration-document-path.service.js";
import { getSignedUrlForFile } from "@/services/s3.service.js";

/**
 * Get CU Registration PDF URL for a student and application number
 */
export const getCuRegistrationPdfUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentId, applicationNumber } = req.params;

    console.info(
      `[CU-REG PDF] Getting PDF URL for student: ${studentId}, application: ${applicationNumber}`,
    );

    // Get student details
    const [student] = await db
      .select({
        id: studentModel.id,
        uid: studentModel.uid,
      })
      .from(studentModel)
      .where(eq(studentModel.id, parseInt(studentId)))
      .limit(1);

    if (!student) {
      throw new ApiError(404, "Student not found");
    }

    // Get dynamic year and regulation data
    const [promotionData] = await db
      .select({
        academicYear: academicYearModel.year,
        regulationShortName: regulationTypeModel.shortName,
      })
      .from(promotionModel)
      .innerJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
      .innerJoin(
        academicYearModel,
        eq(sessionModel.academicYearId, academicYearModel.id),
      )
      .innerJoin(
        programCourseModel,
        eq(promotionModel.programCourseId, programCourseModel.id),
      )
      .innerJoin(
        regulationTypeModel,
        eq(programCourseModel.regulationTypeId, regulationTypeModel.id),
      )
      .where(eq(promotionModel.studentId, parseInt(studentId)))
      .limit(1);

    if (!promotionData) {
      throw new ApiError(404, "Promotion data not found for student");
    }

    // Extract year from academic year string (e.g., "2025-2026" -> 2025)
    const yearMatch = promotionData.academicYear.match(/^(\d{4})/);
    const year = yearMatch
      ? parseInt(yearMatch[1], 10)
      : new Date().getFullYear();

    // Get PDF path configuration
    const pdfPathConfig = await getCuRegPdfPathDynamic(
      parseInt(studentId),
      student.uid,
      applicationNumber,
      {
        year,
        course: promotionData.regulationShortName || "CCF",
      },
    );

    console.info(`[CU-REG PDF] PDF path config:`, pdfPathConfig);

    // Get signed URL for the PDF
    const signedUrl = await getSignedUrlForFile(pdfPathConfig.fullPath, 3600); // 1 hour expiry

    const response = {
      pdfUrl: signedUrl,
      pdfPath: pdfPathConfig.fullPath,
      applicationNumber,
      studentUid: student.uid,
      year,
      regulation: promotionData.regulationShortName || "CCF",
    };

    console.info(`[CU-REG PDF] Generated PDF URL:`, response);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          response,
          "CU Registration PDF URL retrieved successfully",
        ),
      );
  } catch (error) {
    console.error("[CU-REG PDF] Error:", error);
    handleError(error, res, next);
  }
};

/**
 * Get CU Registration PDF URL for a correction request
 */
export const getCuRegistrationPdfUrlByRequestId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { correctionRequestId } = req.params;

    console.info(
      `[CU-REG PDF] Getting PDF URL for correction request: ${correctionRequestId}`,
    );
    console.info(`[CU-REG PDF] Request params:`, req.params);
    console.info(`[CU-REG PDF] Request URL:`, req.url);

    // Get correction request with student details
    const [correctionRequest] = await db
      .select({
        id: cuRegistrationCorrectionRequestModel.id,
        studentId: cuRegistrationCorrectionRequestModel.studentId,
        cuRegistrationApplicationNumber:
          cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
        studentUid: studentModel.uid,
      })
      .from(cuRegistrationCorrectionRequestModel)
      .innerJoin(
        studentModel,
        eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
      )
      .where(
        eq(
          cuRegistrationCorrectionRequestModel.id,
          parseInt(correctionRequestId),
        ),
      )
      .limit(1);

    if (!correctionRequest) {
      throw new ApiError(404, "Correction request not found");
    }

    if (!correctionRequest.cuRegistrationApplicationNumber) {
      throw new ApiError(
        404,
        "Application number not found for this correction request",
      );
    }

    // Get dynamic year and regulation data
    const [promotionData] = await db
      .select({
        academicYear: academicYearModel.year,
        regulationShortName: regulationTypeModel.shortName,
      })
      .from(promotionModel)
      .innerJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
      .innerJoin(
        academicYearModel,
        eq(sessionModel.academicYearId, academicYearModel.id),
      )
      .innerJoin(
        programCourseModel,
        eq(promotionModel.programCourseId, programCourseModel.id),
      )
      .innerJoin(
        regulationTypeModel,
        eq(programCourseModel.regulationTypeId, regulationTypeModel.id),
      )
      .where(eq(promotionModel.studentId, correctionRequest.studentId))
      .limit(1);

    if (!promotionData) {
      throw new ApiError(404, "Promotion data not found for student");
    }

    // Extract year from academic year string (e.g., "2025-2026" -> 2025)
    const yearMatch = promotionData.academicYear.match(/^(\d{4})/);
    const year = yearMatch
      ? parseInt(yearMatch[1], 10)
      : new Date().getFullYear();

    // Get PDF path configuration
    const pdfPathConfig = await getCuRegPdfPathDynamic(
      correctionRequest.studentId,
      correctionRequest.studentUid,
      correctionRequest.cuRegistrationApplicationNumber,
      {
        year,
        course: promotionData.regulationShortName || "CCF",
      },
    );

    console.info(`[CU-REG PDF] PDF path config:`, pdfPathConfig);

    // Get signed URL for the PDF
    const signedUrl = await getSignedUrlForFile(pdfPathConfig.fullPath, 3600); // 1 hour expiry

    const response = {
      pdfUrl: signedUrl,
      pdfPath: pdfPathConfig.fullPath,
      applicationNumber: correctionRequest.cuRegistrationApplicationNumber,
      studentUid: correctionRequest.studentUid,
      year,
      regulation: promotionData.regulationShortName || "CCF",
    };

    console.info(`[CU-REG PDF] Generated PDF URL:`, response);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          response,
          "CU Registration PDF URL retrieved successfully",
        ),
      );
  } catch (error) {
    console.error("[CU-REG PDF] Error:", error);
    handleError(error, res, next);
  }
};
