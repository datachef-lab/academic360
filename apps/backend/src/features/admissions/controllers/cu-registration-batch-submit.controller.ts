import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  findCuRegistrationCorrectionRequestById,
  updateCuRegistrationCorrectionRequest,
  updateStudentDataFromCorrectionRequest,
} from "../services/cu-registration-correction-request.service.js";
import {
  uploadToS3,
  createStudentUploadConfig,
  FileTypeConfigs,
} from "@/services/s3.service.js";
import { uploadToFileSystem } from "@/services/filesystem-storage.service.js";
import { createCuRegistrationDocumentUpload } from "../services/cu-registration-document-upload.service.js";
import { db } from "@/db/index.js";
import { documentModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";
import multer from "multer";

// Configure multer for handling multiple files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

// Submit CU registration correction request with documents (batch upload)
export const submitCuRegistrationCorrectionRequestWithDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      correctionRequestId,
      flags: flagsString,
      payload: payloadString,
      documentNames,
    } = req.body;

    // Parse JSON strings from FormData
    const parsedFlags = flagsString ? JSON.parse(flagsString) : {};
    const parsedPayload = payloadString ? JSON.parse(payloadString) : {};

    console.info(
      `[CU-REG BATCH SUBMIT] Parsed flags:`,
      JSON.stringify(parsedFlags, null, 2),
    );
    console.info(
      `[CU-REG BATCH SUBMIT] Parsed payload:`,
      JSON.stringify(parsedPayload, null, 2),
    );

    const files = (req.files as Express.Multer.File[]) || [];

    console.info(
      `[CU-REG BATCH SUBMIT] Starting batch submission for request: ${correctionRequestId}`,
    );
    console.info(`[CU-REG BATCH SUBMIT] Files received: ${files.length}`);
    console.info(`[CU-REG BATCH SUBMIT] Document Names: ${documentNames}`);

    if (!correctionRequestId) {
      res
        .status(400)
        .json(new ApiError(400, "Correction request ID is required"));
      return;
    }

    // Get the correction request
    const correctionRequest = await findCuRegistrationCorrectionRequestById(
      parseInt(correctionRequestId),
    );
    if (!correctionRequest) {
      res.status(404).json(new ApiError(404, "Correction request not found"));
      return;
    }

    // Determine status based on flags
    const hasCorrectionFlags =
      parsedFlags && Object.values(parsedFlags).some(Boolean);
    const newStatus = hasCorrectionFlags ? "REQUEST_CORRECTION" : "APPROVED";

    // Update the correction request with flags, payload, and status
    const updatedRequest = await updateCuRegistrationCorrectionRequest(
      parseInt(correctionRequestId),
      {
        flags: parsedFlags || {},
        payload: parsedPayload || {},
        status: newStatus,
      },
    );

    console.info(
      `[CU-REG BATCH SUBMIT] Updated request status to: ${newStatus}`,
    );

    // Update actual database fields based on correction request data
    // Always update editable fields (EWS, addresses) on final submission, regardless of correction flags
    if (parsedPayload) {
      console.info(
        `[CU-REG BATCH SUBMIT] Updating database fields for student: ${correctionRequest.student.id}`,
      );
      console.info(
        `[CU-REG BATCH SUBMIT] Payload received:`,
        JSON.stringify(parsedPayload, null, 2),
      );
      console.info(
        `[CU-REG BATCH SUBMIT] Flags received:`,
        JSON.stringify(parsedFlags, null, 2),
      );
      const dbUpdateResult = await updateStudentDataFromCorrectionRequest(
        correctionRequest.student.id,
        parsedFlags || {},
        parsedPayload,
      );

      if (dbUpdateResult.success) {
        console.info(
          `[CU-REG BATCH SUBMIT] Database fields updated successfully:`,
          dbUpdateResult.updatedFields,
        );
      } else {
        console.warn(
          `[CU-REG BATCH SUBMIT] Database field updates failed:`,
          dbUpdateResult.errors,
        );
        // Don't fail the entire request, just log the warning
      }
    }

    // Process document uploads
    const uploadedDocuments = [];
    const documentNamesArray = documentNames ? JSON.parse(documentNames) : [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const documentName = documentNamesArray[i];

      if (!documentName) {
        console.warn(
          `[CU-REG BATCH SUBMIT] No document name for file: ${file.originalname}`,
        );
        continue;
      }

      try {
        // Look up document ID from database using document name
        const [documentRecord] = await db
          .select()
          .from(documentModel)
          .where(eq(documentModel.name, documentName));

        if (!documentRecord) {
          console.warn(
            `[CU-REG BATCH SUBMIT] Document not found: ${documentName}`,
          );
          continue;
        }

        // Get document type name for file system storage
        const documentTypeMap: Record<string, string> = {
          "Class XII Marksheet": "class-xii-marksheet",
          "Aadhaar Card": "aadhaar-card",
          "APAAR ID Card": "apaar-id-card",
          "Father Photo ID": "father-photo-id",
          "Mother Photo ID": "mother-photo-id",
          "EWS Certificate": "ews-certificate",
        };
        const documentType =
          documentTypeMap[documentName] ||
          `document-${documentName.toLowerCase().replace(/\s+/g, "-")}`;

        // Try S3 first, fallback to file system
        let uploadResult;
        try {
          const studentUid = correctionRequest.student.uid;
          const uploadConfig = createStudentUploadConfig(
            studentUid,
            "cu-registration-documents",
            {
              maxFileSizeMB: 10,
              allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
              makePublic: false,
            },
          );
          uploadResult = await uploadToS3(file, uploadConfig);
          console.info(
            `[CU-REG BATCH SUBMIT] S3 upload successful for: ${file.originalname}`,
          );
        } catch (s3Error: any) {
          if (s3Error.message?.includes("S3 service is not configured")) {
            uploadResult = await uploadToFileSystem(
              file,
              correctionRequest.cuRegistrationApplicationNumber,
              documentType,
            );
            console.info(
              `[CU-REG BATCH SUBMIT] File system upload successful for: ${file.originalname}`,
            );
          } else {
            throw s3Error;
          }
        }

        // Create document upload record
        const documentUpload = await createCuRegistrationDocumentUpload({
          cuRegistrationCorrectionRequestId: parseInt(correctionRequestId),
          documentId: documentRecord.id,
          documentUrl: uploadResult.url,
          path: uploadResult.key,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          remarks: null,
        });

        uploadedDocuments.push(documentUpload);
        console.info(
          `[CU-REG BATCH SUBMIT] Document record created for: ${file.originalname}`,
        );
      } catch (error) {
        console.error(
          `[CU-REG BATCH SUBMIT] Error uploading ${file.originalname}:`,
          error,
        );
        // Continue with other files even if one fails
      }
    }

    console.info(
      `[CU-REG BATCH SUBMIT] Batch submission completed. Uploaded ${uploadedDocuments.length} documents`,
    );

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          correctionRequest: updatedRequest,
          uploadedDocuments,
        },
        "CU registration correction request submitted with documents successfully!",
      ),
    );
  } catch (error) {
    console.error("[CU-REG BATCH SUBMIT] Error:", error);
    handleError(error, res, next);
  }
};
