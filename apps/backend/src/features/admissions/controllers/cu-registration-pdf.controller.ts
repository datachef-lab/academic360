import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { db } from "@/db/index.js";
import jwt from "jsonwebtoken";
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
import { getSignedUrlForFile, getFileFromS3 } from "@/services/s3.service.js";
import { CuRegistrationNumberService } from "@/services/cu-registration-number.service.js";

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
      .where(eq(studentModel.id, parseInt(studentId as string)))
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
      .where(eq(promotionModel.studentId, parseInt(studentId as string)))
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
      parseInt(studentId as string),
      student.uid,
      applicationNumber as string,
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
        personalInfoDeclaration:
          cuRegistrationCorrectionRequestModel.personalInfoDeclaration,
        addressInfoDeclaration:
          cuRegistrationCorrectionRequestModel.addressInfoDeclaration,
        subjectsDeclaration:
          cuRegistrationCorrectionRequestModel.subjectsDeclaration,
        documentsDeclaration:
          cuRegistrationCorrectionRequestModel.documentsDeclaration,
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
          parseInt(correctionRequestId as string),
        ),
      )
      .limit(1);

    if (!correctionRequest) {
      throw new ApiError(404, "Correction request not found");
    }

    if (!correctionRequest.cuRegistrationApplicationNumber) {
      // Check if all declarations are completed
      const allDeclarationsCompleted =
        correctionRequest.personalInfoDeclaration &&
        correctionRequest.addressInfoDeclaration &&
        correctionRequest.subjectsDeclaration &&
        correctionRequest.documentsDeclaration;

      if (!allDeclarationsCompleted) {
        throw new ApiError(
          400,
          "Cannot generate PDF: Please complete all required declarations first. Complete Personal Info, Address Info, Subjects, and Documents tabs.",
        );
      }

      // If all declarations are completed but no application number, this shouldn't happen
      // but we'll generate one as a fallback
      const applicationNumber =
        await CuRegistrationNumberService.generateNextApplicationNumber();

      // Update the correction request with the application number
      await db
        .update(cuRegistrationCorrectionRequestModel)
        .set({ cuRegistrationApplicationNumber: applicationNumber })
        .where(
          eq(
            cuRegistrationCorrectionRequestModel.id,
            parseInt(correctionRequestId as string),
          ),
        );

      console.info(
        `[CU-REG PDF] Generated application number for completed request: ${applicationNumber}`,
      );

      // Use the generated application number for PDF generation
      correctionRequest.cuRegistrationApplicationNumber = applicationNumber;
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

    // Get signed URL for the PDF (keep for download if needed)
    const signedUrl = await getSignedUrlForFile(pdfPathConfig.fullPath, 3600); // 1 hour expiry

    // Return proxy URL instead of direct S3 URL to allow iframe embedding
    const proxyUrl = `/api/admissions/cu-registration-pdf/proxy/request/${correctionRequestId}`;
    const response = {
      pdfUrl: proxyUrl, // Use proxy URL instead of direct S3 signed URL
      originalPdfUrl: signedUrl, // Keep original for download if needed
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

/**
 * Proxy endpoint to serve PDF with headers that allow iframe embedding
 */
export const proxyCuRegistrationPdf = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { correctionRequestId } = req.params;

    console.info(
      `[CU-REG PDF PROXY] Proxying PDF for correction request: ${correctionRequestId}`,
    );

    // Basic authentication check - verify user is logged in (either admin or student)
    // This is a lightweight check since the correction request ID itself provides some security
    const authHeader =
      req.headers.authorization || (req.headers.Authorization as string);
    const hasAuthHeader = authHeader?.startsWith("Bearer ");

    // Also check for student_jwt cookie (for student console) or jwt cookie (for admin console)
    const { app } = req.headers;
    const origin = req.get("origin") || req.get("referer") || "";
    const isStudentConsole =
      app === "student-console" ||
      origin.includes("localhost:3000") ||
      origin.includes("student-console");

    const cookieName = isStudentConsole ? "student_jwt" : "jwt";
    const refreshToken =
      req.cookies[cookieName] || req.cookies.student_jwt || req.cookies.jwt;
    const hasCookie = !!refreshToken;

    // If no auth header and no cookie, require authentication
    if (!hasAuthHeader && !hasCookie) {
      res
        .status(401)
        .json(new ApiError(401, "Unauthorized - Please log in to view PDF"));
      return;
    }

    // If we have a cookie, verify it's valid (basic check)
    if (hasCookie && !hasAuthHeader) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET!,
        ) as { id: number; type: string };
        // Token is valid, proceed
        console.log(
          `[CU-REG PDF PROXY] Authenticated via ${cookieName} cookie for user:`,
          decoded.id,
        );
      } catch (err) {
        console.log(
          `[CU-REG PDF PROXY] Invalid ${cookieName} cookie, requiring authentication`,
        );
        res
          .status(401)
          .json(new ApiError(401, "Unauthorized - Invalid or expired session"));
        return;
      }
    }

    // Get correction request to find PDF path
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
          parseInt(correctionRequestId as string),
        ),
      )
      .limit(1);

    if (
      !correctionRequest ||
      !correctionRequest.cuRegistrationApplicationNumber
    ) {
      res
        .status(404)
        .json(
          new ApiError(
            404,
            "Correction request or application number not found",
          ),
        );
      return;
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
      res
        .status(404)
        .json(new ApiError(404, "Promotion data not found for student"));
      return;
    }

    // Extract year from academic year string
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

    // Get file from S3
    const s3Response = await getFileFromS3(pdfPathConfig.fullPath);

    if (!s3Response || !s3Response.Body) {
      res.status(404).json(new ApiError(404, "PDF file not found in storage"));
      return;
    }

    // Set headers that allow iframe embedding
    res.setHeader("Content-Type", "application/pdf");
    // Don't set Content-Disposition for inline PDF viewing in iframe - it can cause issues
    // res.setHeader("Content-Disposition", `inline; filename="cu-registration-${correctionRequest.cuRegistrationApplicationNumber}.pdf"`);

    // Allow iframe embedding - remove X-Frame-Options and set permissive CSP
    res.removeHeader("X-Frame-Options");

    // Set CORS headers to allow iframe loading from student console
    // Extract origin from referer if origin header is not present (iframe requests)
    let requestOrigin = req.get("origin");
    let mainConsoleOrigin: string | null = null;

    if (!requestOrigin) {
      const referer = req.get("referer");
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          requestOrigin = refererUrl.origin;

          // Check if the referer suggests we're in simulation mode (main-console embedding student-console)
          // Main console is typically on localhost:5173 or similar
          if (
            referer.includes("localhost:5173") ||
            referer.includes("main-console") ||
            referer.includes("admin-console")
          ) {
            mainConsoleOrigin = requestOrigin; // This is the main-console origin
            // Try to get student console origin from the referer path or use default
            requestOrigin = "http://localhost:3000"; // Student console origin
          }
        } catch (e) {
          // Invalid referer URL, default to localhost:3000 for student console
          requestOrigin = "http://localhost:3000";
        }
      } else {
        // Default to student console origin
        requestOrigin = "http://localhost:3000";
      }
    }

    // Set CSP to allow both student console and main console (for simulation mode)
    // frame-ancestors allows embedding in iframes from these origins
    if (mainConsoleOrigin) {
      // In simulation mode: allow both main-console and student-console origins
      res.setHeader(
        "Content-Security-Policy",
        `frame-ancestors ${mainConsoleOrigin} ${requestOrigin} *`,
      );
      console.log(
        `[CU-REG PDF PROXY] Simulation mode detected - allowing frame-ancestors: ${mainConsoleOrigin}, ${requestOrigin}`,
      );
    } else {
      // Normal mode: allow student console and any origin
      res.setHeader(
        "Content-Security-Policy",
        `frame-ancestors ${requestOrigin} *`,
      );
    }
    res.setHeader("X-Content-Type-Options", "nosniff");

    // IMPORTANT: When using credentials, cannot use wildcard - must specify exact origin
    if (requestOrigin !== "*") {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      // Fallback without credentials if origin is wildcard
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    // Additional headers for PDF viewing
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Stream the PDF
    if (s3Response.Body && typeof s3Response.Body.pipe === "function") {
      // Body is a stream - pipe directly to response
      console.log("[CU-REG PDF PROXY] Streaming PDF from S3 (stream mode)...");
      s3Response.Body.on("error", (err: Error) => {
        console.error("[CU-REG PDF PROXY] Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json(new ApiError(500, "Error streaming PDF"));
        }
      });
      s3Response.Body.pipe(res);
    } else {
      // If Body is a buffer or other type, convert to buffer and send
      console.log("[CU-REG PDF PROXY] Converting PDF body to buffer...");
      const chunks: Buffer[] = [];
      const body = s3Response.Body as any;

      // Handle different body types
      if (body && typeof body[Symbol.asyncIterator] === "function") {
        // It's an async iterable
        for await (const chunk of body) {
          chunks.push(Buffer.from(chunk));
        }
      } else if (Buffer.isBuffer(body)) {
        chunks.push(body);
      } else if (body) {
        // Try to convert to buffer
        chunks.push(Buffer.from(body));
      }

      if (chunks.length === 0) {
        console.error("[CU-REG PDF PROXY] No data received from S3");
        res.status(404).json(new ApiError(404, "PDF file not found or empty"));
        return;
      }

      const buffer = Buffer.concat(chunks);
      console.log(
        `[CU-REG PDF PROXY] Sending PDF buffer (${buffer.length} bytes)`,
      );

      // Verify it's actually a PDF by checking the magic bytes (%PDF)
      const isPdf =
        buffer.length >= 4 &&
        buffer[0] === 0x25 && // %
        buffer[1] === 0x50 && // P
        buffer[2] === 0x44 && // D
        buffer[3] === 0x46; // F

      if (!isPdf) {
        console.error("[CU-REG PDF PROXY] Response is not a valid PDF file");
        console.error(
          "[CU-REG PDF PROXY] First 100 bytes:",
          buffer.slice(0, 100).toString("hex"),
        );
        console.error(
          "[CU-REG PDF PROXY] Response content (first 200 chars):",
          buffer.toString("utf-8").substring(0, 200),
        );
        res
          .status(500)
          .json(new ApiError(500, "Response from S3 is not a valid PDF file"));
        return;
      }

      console.log("[CU-REG PDF PROXY] Valid PDF confirmed, sending response");
      res.send(buffer);
    }
  } catch (error) {
    console.error("[CU-REG PDF PROXY] Error:", error);
    handleError(error, res, next);
  }
};
