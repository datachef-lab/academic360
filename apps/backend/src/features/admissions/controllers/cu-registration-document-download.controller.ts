import { Request, Response, NextFunction } from "express";
import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { downloadCuRegistrationDocumentsAsZip } from "../services/cu-registration-document-upload.service.js";
import JSZip from "jszip";
import { socketService } from "@/services/socketService.js";

/**
 * Download CU registration documents as ZIP files for a specific year and regulation type
 *
 * @description
 * - Downloads all generated PDFs and uploaded documents from S3
 * - Returns two ZIP files: one for PDFs and one for documents
 * - Organizes files by student UID (PDFs) and document type (documents)
 *
 * @response
 * - Success: Two ZIP files as attachments
 * - Error: JSON with error details
 *
 * @usage
 * GET /api/admissions/cu-registration-documents/download/:year/:regulationType
 */
export const downloadCuRegistrationDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { year, regulationType } = req.params;

    // Validate parameters
    if (!year || !regulationType) {
      res
        .status(400)
        .json(new ApiError(400, "Year and regulation type are required"));
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 3000) {
      res.status(400).json(new ApiError(400, "Invalid year format"));
      return;
    }

    console.info(
      `[CU-REG-DOWNLOAD] Starting download for year ${yearNum}, regulation ${regulationType}`,
    );

    // Get socket.io instance and session ID
    const io = socketService.getIO();
    const uploadSessionId =
      req.body.uploadSessionId ||
      req.query.uploadSessionId ||
      `download-${Date.now()}`;
    const userId = (req as any).user?.id?.toString(); // Get user ID from JWT middleware

    // Download and zip documents with socket progress
    const result = await downloadCuRegistrationDocumentsAsZip(
      yearNum,
      regulationType,
      io,
      uploadSessionId,
      userId,
      "combined",
    );

    if (result.pdfCount === 0 && result.documentsCount === 0) {
      res
        .status(404)
        .json(
          new ApiError(
            404,
            "No documents found for the specified year and regulation type",
          ),
        );
      return;
    }

    console.info(`[CU-REG-DOWNLOAD] Download completed`, {
      pdfCount: result.pdfCount,
      documentsCount: result.documentsCount,
      pdfZipSize: result.pdfZipBuffer.length,
      documentsZipSize: result.documentsZipBuffer.length,
    });

    // Set response headers for ZIP download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cu-registration-${year}-${regulationType}-pdfs.zip"`,
    );

    // Send PDF ZIP first
    res.send(result.pdfZipBuffer);

    // Note: We can only send one response per request
    // For two ZIP files, we need to either:
    // 1. Create a combined ZIP containing both
    // 2. Use a different approach (like returning URLs)
    // 3. Send them as separate requests

    // For now, let's create a combined ZIP approach
    const combinedZip = new JSZip();

    // Add PDF ZIP as a file
    combinedZip.file(`pdfs-${year}-${regulationType}.zip`, result.pdfZipBuffer);

    // Add documents ZIP as a file
    combinedZip.file(
      `documents-${year}-${regulationType}.zip`,
      result.documentsZipBuffer,
    );

    // Generate combined ZIP
    const combinedZipBuffer = await combinedZip.generateAsync({
      type: "nodebuffer",
    });

    // Update headers for combined ZIP
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cu-registration-${year}-${regulationType}-combined.zip"`,
    );

    // Send combined ZIP
    res.send(combinedZipBuffer);
  } catch (error) {
    console.error("[CU-REG-DOWNLOAD] Error downloading documents:", error);
    handleError(error, res, next);
  }
};

/**
 * Download only PDFs as ZIP
 */
export const downloadCuRegistrationPdfsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { year, regulationType } = req.params;

    // Validate parameters
    if (!year || !regulationType) {
      res
        .status(400)
        .json(new ApiError(400, "Year and regulation type are required"));
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 3000) {
      res.status(400).json(new ApiError(400, "Invalid year format"));
      return;
    }

    console.info(
      `[CU-REG-DOWNLOAD] Starting PDF download for year ${yearNum}, regulation ${regulationType}`,
    );

    // Get socket.io instance and session ID
    const io = socketService.getIO();
    const uploadSessionId =
      req.body.uploadSessionId ||
      req.query.uploadSessionId ||
      `download-${Date.now()}`;
    const userId = (req as any).user?.id?.toString(); // Get user ID from JWT middleware

    // Debug controller parameters
    console.log("[CU-REG-DOWNLOAD] Controller Debug:", {
      io: !!io,
      ioType: typeof io,
      userId: userId,
      userIdType: typeof userId,
      uploadSessionId: uploadSessionId,
      uploadSessionIdType: typeof uploadSessionId,
      reqUser: (req as any).user,
    });

    // Download and zip documents with socket progress
    const result = await downloadCuRegistrationDocumentsAsZip(
      yearNum,
      regulationType,
      io,
      uploadSessionId,
      userId,
      "pdfs",
    );

    if (result.pdfCount === 0) {
      res
        .status(404)
        .json(
          new ApiError(
            404,
            "No PDFs found for the specified year and regulation type",
          ),
        );
      return;
    }

    console.info(`[CU-REG-DOWNLOAD] PDF download completed`, {
      pdfCount: result.pdfCount,
      pdfZipSize: result.pdfZipBuffer.length,
    });

    // Set response headers for ZIP download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cu-registration-pdfs-${year}-${regulationType}.zip"`,
    );

    // Send PDF ZIP
    res.send(result.pdfZipBuffer);
  } catch (error) {
    console.error("[CU-REG-DOWNLOAD] Error downloading PDFs:", error);
    handleError(error, res, next);
  }
};

/**
 * Download only uploaded documents as ZIP
 */
export const downloadDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { year, regulationType } = req.params;

    // Validate parameters
    if (!year || !regulationType) {
      res
        .status(400)
        .json(new ApiError(400, "Year and regulation type are required"));
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 3000) {
      res.status(400).json(new ApiError(400, "Invalid year format"));
      return;
    }

    console.info(
      `[CU-REG-DOWNLOAD] Starting documents download for year ${yearNum}, regulation ${regulationType}`,
    );

    // Get socket.io instance and session ID
    const io = socketService.getIO();
    const uploadSessionId =
      req.body.uploadSessionId ||
      req.query.uploadSessionId ||
      `download-${Date.now()}`;
    const userId = (req as any).user?.id?.toString(); // Get user ID from JWT middleware

    // Download and zip documents with socket progress
    const result = await downloadCuRegistrationDocumentsAsZip(
      yearNum,
      regulationType,
      io,
      uploadSessionId,
      userId,
      "documents",
    );

    if (result.documentsCount === 0) {
      res
        .status(404)
        .json(
          new ApiError(
            404,
            "No documents found for the specified year and regulation type",
          ),
        );
      return;
    }

    console.info(`[CU-REG-DOWNLOAD] Documents download completed`, {
      documentsCount: result.documentsCount,
      documentsZipSize: result.documentsZipBuffer.length,
    });

    // Set response headers for ZIP download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cu-registration-documents-${year}-${regulationType}.zip"`,
    );

    // Send documents ZIP
    res.send(result.documentsZipBuffer);
  } catch (error) {
    console.error("[CU-REG-DOWNLOAD] Error downloading documents:", error);
    handleError(error, res, next);
  }
};
