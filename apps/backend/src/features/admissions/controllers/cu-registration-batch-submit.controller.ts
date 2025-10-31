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
  createUploadConfig,
  FileTypeConfigs,
} from "@/services/s3.service.js";
import {
  getCuRegDocumentPathFromName,
  getCuRegDocumentPathFromNameDynamic,
} from "../services/cu-registration-document-path.service.js";
import {
  uploadToFileSystem,
  uploadToFileSystemAtPath,
} from "@/services/filesystem-storage.service.js";
import { createCuRegistrationDocumentUpload } from "../services/cu-registration-document-upload.service.js";
import { db } from "@/db/index.js";
import { documentModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";
import multer from "multer";
import { CuRegistrationNumberService } from "@/services/cu-registration-number.service.js";
import {
  convertToJpg,
  getDocumentConversionSettings,
} from "@/services/image-conversion.service.js";
import { CuRegistrationPdfIntegrationService } from "@/services/cu-registration-pdf-integration.service.js";
import { sendAdmissionRegistrationNotification } from "../services/cu-registration-correction-request.service.js";

// Configure multer for handling multiple files
const upload = multer({
  storage: multer.memoryStorage(),
  // Explicitly set high limits to prevent 413 errors - backend handles compression
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 10, // Maximum 10 files
    fieldSize: 50 * 1024 * 1024, // 50MB for form fields
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

    // Debug: Log file sizes
    let totalSizeMB = 0;
    files.forEach((file, index) => {
      const sizeMB = file.size / (1024 * 1024);
      totalSizeMB += sizeMB;
      console.info(
        `[CU-REG BATCH SUBMIT] File ${index + 1}: ${file.originalname} - ${sizeMB.toFixed(2)}MB`,
      );
    });

    console.info(
      `[CU-REG BATCH SUBMIT] Total payload size: ${totalSizeMB.toFixed(2)}MB`,
    );

    // Check if total size exceeds reasonable limit
    if (totalSizeMB > 50) {
      console.warn(
        `[CU-REG BATCH SUBMIT] Large payload detected: ${totalSizeMB.toFixed(2)}MB`,
      );
    }

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

    // Determine status based on correction flags
    // If any correction is requested, status should be REQUEST_CORRECTION
    // If no corrections are requested, status should be ONLINE_REGISTRATION_DONE
    const hasAnyCorrectionFlags = Object.values(parsedFlags).some(
      (flag) => flag === true,
    );
    const newStatus = hasAnyCorrectionFlags
      ? "REQUEST_CORRECTION"
      : "ONLINE_REGISTRATION_DONE";

    console.info(`[CU-REG BATCH SUBMIT] Status determination:`, {
      hasAnyCorrectionFlags,
      correctionFlags: parsedFlags,
      determinedStatus: newStatus,
    });

    // Generate application number when all declarations are completed
    console.info(
      `[CU-REG BATCH SUBMIT] Generating application number for final submission`,
    );

    const applicationNumber =
      await CuRegistrationNumberService.generateNextApplicationNumber();
    console.info(
      `[CU-REG BATCH SUBMIT] Generated application number: ${applicationNumber}`,
    );

    // Check if application number already exists before setting it
    const updatePayload: any = {
      genderCorrectionRequest: parsedFlags?.gender || false,
      nationalityCorrectionRequest: parsedFlags?.nationality || false,
      apaarIdCorrectionRequest: parsedFlags?.apaarId || false,
      subjectsCorrectionRequest: parsedFlags?.subjects || false,
      status: newStatus,
      onlineRegistrationDone: true, // Mark online registration as completed

      // Set all declaration flags to true for final submission
      personalInfoDeclaration: true,
      addressInfoDeclaration: true,
      subjectsDeclaration: true,
      documentsDeclaration: true,

      // Pass the payload to update personal info and addresses
      payload: parsedPayload,
    };

    // Set application number for final submission
    updatePayload.cuRegistrationApplicationNumber = applicationNumber;
    console.info(
      `[CU-REG BATCH SUBMIT] Setting application number: ${applicationNumber}`,
    );

    // Update the correction request with flags, payload, status, and application number
    const updatedRequest = await updateCuRegistrationCorrectionRequest(
      parseInt(correctionRequestId),
      updatePayload,
    );

    console.info(
      `[CU-REG BATCH SUBMIT] Updated request status to: ${newStatus} and marked online registration as done`,
    );
    console.info(
      `[CU-REG BATCH SUBMIT] Set all declaration flags to true for final submission - PDF generation should be triggered`,
    );

    // Update actual database fields based on correction request data
    // On final submit, update all fields that were declared in previous steps
    if (parsedPayload && correctionRequest.student?.id) {
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

      // Update all student data fields on final submission
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
    let s3UploadedCount = 0; // track S3 successes deterministically
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

        // Get conversion settings for this document type
        const conversionSettings = getDocumentConversionSettings(documentName);

        console.info(
          `[CU-REG BATCH SUBMIT] Converting ${file.originalname} to JPG with settings:`,
          conversionSettings,
        );

        // Convert file to JPG with compression
        let conversionResult;
        try {
          conversionResult = await convertToJpg(file, conversionSettings);
          console.info(
            `[CU-REG BATCH SUBMIT] Conversion successful: ${file.originalname} -> ${conversionResult.mimeType}`,
          );
        } catch (conversionError) {
          console.error(
            `[CU-REG BATCH SUBMIT] Conversion failed for ${file.originalname}:`,
            conversionError,
          );
          throw conversionError;
        }

        console.info(
          `[CU-REG BATCH SUBMIT] Conversion complete: ${conversionResult.originalSizeKB.toFixed(2)}KB -> ${conversionResult.sizeKB.toFixed(2)}KB`,
        );

        // Get path configuration from CU Reg document path service (with dynamic data)
        const studentUid = correctionRequest.student.uid;
        const studentId = correctionRequest.student.id;
        const cuRegNumber = applicationNumber; // Use the newly generated application number

        if (!studentId) {
          throw new Error("Student ID is required for dynamic path generation");
        }

        const pathConfig = await getCuRegDocumentPathFromNameDynamic(
          studentId,
          studentUid,
          cuRegNumber,
          documentName,
        );

        console.info(
          `[CU-REG BATCH SUBMIT] Document path: ${pathConfig.fullPath}`,
        );

        // Create a new file object with converted buffer
        const convertedFile: Express.Multer.File = {
          ...file,
          buffer: conversionResult.buffer,
          mimetype: conversionResult.mimeType,
          size: conversionResult.buffer.length,
          originalname: pathConfig.filename,
        };

        // Upload to S3 and mirror to filesystem — both must succeed
        let uploadResult;
        try {
          // Create upload config using the folder path from path service
          const uploadConfig = createUploadConfig(pathConfig.folder, {
            customFileName: pathConfig.filename,
            maxFileSizeMB: 10,
            allowedMimeTypes: [
              ...FileTypeConfigs.IMAGES,
              ...FileTypeConfigs.PDF_ONLY,
            ],
            makePublic: false,
            metadata: {
              studentUid,
              cuRegNumber,
              documentCode: pathConfig.documentCode,
              documentName,
              originalSize: conversionResult.originalSizeKB.toFixed(2) + "KB",
              compressedSize: conversionResult.sizeKB.toFixed(2) + "KB",
            },
          });

          uploadResult = await uploadToS3(convertedFile, uploadConfig);
          console.info(
            `[CU-REG BATCH SUBMIT] S3 upload successful: ${pathConfig.fullPath}`,
          );
          s3UploadedCount++;
          // Mirror to filesystem (required)
          await uploadToFileSystemAtPath(
            convertedFile,
            pathConfig.folder,
            pathConfig.filename,
          );
          console.info(
            `[CU-REG BATCH SUBMIT] Mirrored file to filesystem for application ${cuRegNumber}`,
          );
        } catch (s3Error: any) {
          // No fallback: both S3 and filesystem saves are required for consistency
          throw s3Error;
        }

        // Create document upload record
        const documentUpload = await createCuRegistrationDocumentUpload({
          cuRegistrationCorrectionRequestId: parseInt(correctionRequestId),
          documentId: documentRecord.id,
          documentUrl: uploadResult.url,
          path: uploadResult.key,
          fileName: convertedFile.originalname,
          fileType: convertedFile.mimetype,
          fileSize: convertedFile.size,
          remarks: `Converted to JPG (${conversionResult.sizeKB.toFixed(2)}KB from ${conversionResult.originalSizeKB.toFixed(2)}KB)`,
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
      `[CU-REG BATCH SUBMIT] Batch submission completed. Uploaded ${uploadedDocuments.length}/${documentNamesArray.length} documents`,
    );

    const allDocsUploaded =
      uploadedDocuments.length === documentNamesArray.length;
    const allDocsOnS3 = s3UploadedCount === documentNamesArray.length;

    // Check if there are any correction flags
    const hasCorrectionFlags = Object.values(parsedFlags).some(
      (flag) => flag === true,
    );

    // Generate PDF only if: all docs uploaded to S3, application number exists, and final submit criteria met
    const hasApplicationNumber =
      !!updatedRequest?.cuRegistrationApplicationNumber;
    const allDeclarationsTrue = !!(
      updatedRequest?.personalInfoDeclaration &&
      updatedRequest?.addressInfoDeclaration &&
      updatedRequest?.subjectsDeclaration &&
      updatedRequest?.documentsDeclaration
    );
    const statusNotPending =
      !!updatedRequest?.status && updatedRequest.status !== "PENDING";
    const isFinalSubmitted = allDeclarationsTrue && statusNotPending;

    if (
      allDocsUploaded &&
      allDocsOnS3 &&
      hasApplicationNumber &&
      isFinalSubmitted
    ) {
      try {
        console.info(
          `[CU-REG BATCH SUBMIT] Generating PDF for final submission`,
          {
            studentId: correctionRequest.student.id,
            correctionRequestId: parseInt(correctionRequestId),
            applicationNumber,
            studentUid: correctionRequest.student.uid,
          },
        );

        const studentId = correctionRequest.student.id;
        if (!studentId) {
          throw new Error("Student ID is required for PDF generation");
        }

        const pdfResult =
          await CuRegistrationPdfIntegrationService.generateCuRegistrationPdfForFinalSubmission(
            studentId,
            parseInt(correctionRequestId),
            applicationNumber,
            correctionRequest.student.uid,
          );

        if (pdfResult.success) {
          console.info(
            `[CU-REG BATCH SUBMIT] PDF generated successfully: ${pdfResult.pdfPath}`,
          );

          // Add the generated PDF to the document uploads table so it appears in frontend
          try {
            // Find the PDF document type (assuming it has ID 6 or we need to create one)
            const [pdfDocument] = await db
              .select()
              .from(documentModel)
              .where(eq(documentModel.name, "CU Registration PDF"))
              .limit(1);

            if (pdfDocument) {
              const pdfDocumentUpload =
                await createCuRegistrationDocumentUpload({
                  cuRegistrationCorrectionRequestId:
                    parseInt(correctionRequestId),
                  documentId: pdfDocument.id,
                  documentUrl: pdfResult.s3Url || pdfResult.pdfPath,
                  path: pdfResult.s3Url || pdfResult.pdfPath,
                  fileName: `CU_${applicationNumber}.pdf`,
                  fileType: "application/pdf",
                  fileSize: 0, // We don't have the size here
                  remarks: "Generated CU Registration PDF",
                });

              uploadedDocuments.push(pdfDocumentUpload);
              console.info(
                `[CU-REG BATCH SUBMIT] PDF document record created: ${pdfDocumentUpload?.id}`,
              );
            } else {
              console.warn(
                `[CU-REG BATCH SUBMIT] PDF document type not found in database`,
              );
            }
          } catch (pdfRecordError) {
            console.error(
              `[CU-REG BATCH SUBMIT] Error creating PDF document record:`,
              pdfRecordError,
            );
            // Don't fail the entire request if PDF record creation fails
          }
        } else {
          console.warn(
            `[CU-REG BATCH SUBMIT] PDF generation failed: ${pdfResult.error}`,
          );
        }
        // Send email notification with PDF attachment
        if (pdfResult.pdfBuffer) {
          try {
            console.info(
              `[CU-REG BATCH SUBMIT] Sending admission registration email notification`,
              {
                studentId: correctionRequest.student.id,
                applicationNumber,
                pdfBufferSize: pdfResult.pdfBuffer.length,
                pdfUrl: pdfResult.s3Url,
              },
            );

            const notificationResult =
              await sendAdmissionRegistrationNotification(
                correctionRequest.student.id!,
                applicationNumber,
                pdfResult.pdfBuffer,
                pdfResult.s3Url!,
              );

            if (notificationResult.success) {
              console.info(
                `[CU-REG BATCH SUBMIT] Email notification sent successfully`,
                { notificationId: notificationResult.notificationId },
              );
            } else {
              console.error(
                `[CU-REG BATCH SUBMIT] Failed to send email notification:`,
                notificationResult.error,
              );
            }
          } catch (notificationError) {
            console.error(
              `[CU-REG BATCH SUBMIT] Error sending email notification:`,
              notificationError,
            );
            // Don't fail the entire request if notification fails
          }
        } else {
          console.warn(
            `[CU-REG BATCH SUBMIT] PDF buffer not available for notification`,
          );
        }
      } catch (pdfError) {
        console.error(`[CU-REG BATCH SUBMIT] PDF generation error:`, pdfError);
        // Don't fail the entire request if PDF generation fails
      }
    }

    if (!allDocsUploaded || !allDocsOnS3) {
      res.status(207).json(
        new ApiResponse(
          207,
          "PARTIAL_SUCCESS",
          {
            correctionRequest: updatedRequest,
            uploadedDocuments,
            expectedDocuments: documentNamesArray.length,
            uploadedCount: uploadedDocuments.length,
            allDocsOnS3,
          },
          "Some documents failed to upload. Please retry the missing uploads.",
        ),
      );
      return;
    }

    if (!hasApplicationNumber || !isFinalSubmitted) {
      res.status(207).json(
        new ApiResponse(
          207,
          "PARTIAL_SUCCESS",
          {
            correctionRequest: updatedRequest,
            uploadedDocuments,
            expectedDocuments: documentNamesArray.length,
            uploadedCount: uploadedDocuments.length,
            allDocsOnS3,
            hasApplicationNumber,
            isFinalSubmitted,
          },
          "Final submission incomplete (missing application number or final flag)",
        ),
      );
      return;
    }

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

// Personal Info Declaration Endpoint
export const submitPersonalInfoDeclaration = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { correctionRequestId, flags, personalInfo } = req.body;
    console.info("[CU-REG BACKEND] Personal declaration - incoming", {
      correctionRequestId,
      flags,
      personalInfoKeys: personalInfo ? Object.keys(personalInfo) : [],
    });
    console.info(
      "[CU-REG BACKEND] Personal declaration - personalInfo details:",
      {
        apaarId: personalInfo?.apaarId,
        apaarIdType: typeof personalInfo?.apaarId,
        fullPersonalInfo: personalInfo,
      },
    );

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

    // Update the correction request with personal info declaration
    const updatedRequest = await updateCuRegistrationCorrectionRequest(
      parseInt(correctionRequestId),
      {
        personalInfoDeclaration: true,
        genderCorrectionRequest: flags?.gender || false,
        nationalityCorrectionRequest: flags?.nationality || false,
        aadhaarCardNumberCorrectionRequest: flags?.aadhaarNumber || false,
        apaarIdCorrectionRequest: flags?.apaarId || false,
      },
    );
    console.info("[CU-REG BACKEND] Personal declaration - request updated", {
      id: correctionRequestId,
      status: updatedRequest?.status,
      personalInfoDeclaration: (updatedRequest as any)?.personalInfoDeclaration,
      flagsSaved: {
        genderCorrectionRequest: (updatedRequest as any)
          ?.genderCorrectionRequest,
        nationalityCorrectionRequest: (updatedRequest as any)
          ?.nationalityCorrectionRequest,
        aadhaarCardNumberCorrectionRequest: (updatedRequest as any)
          ?.aadhaarCardNumberCorrectionRequest,
        apaarIdCorrectionRequest: (updatedRequest as any)
          ?.apaarIdCorrectionRequest,
      },
    });

    // Update student data if payload is provided
    if (personalInfo && correctionRequest.student?.id) {
      console.info(
        "[CU-REG BACKEND] Personal declaration - calling updateStudentDataFromCorrectionRequest",
        {
          studentId: correctionRequest.student.id,
          flags: flags || {},
          personalInfo: personalInfo,
          apaarIdInPersonalInfo: personalInfo.apaarId,
          apaarIdType: typeof personalInfo.apaarId,
        },
      );

      const dbUpdateResult = await updateStudentDataFromCorrectionRequest(
        correctionRequest.student.id,
        flags || {},
        { personalInfo },
      );
      console.info(
        "[CU-REG BACKEND] Personal declaration - student data update result",
        dbUpdateResult,
      );

      if (!dbUpdateResult.success) {
        console.warn(
          "[PERSONAL DECLARATION] Database field updates failed:",
          dbUpdateResult.errors,
        );
      }
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { correctionRequest: updatedRequest },
          "Personal info declaration submitted successfully!",
        ),
      );
  } catch (error) {
    console.error("[PERSONAL DECLARATION] Error:", error);
    handleError(error, res, next);
  }
};

// Address Info Declaration Endpoint
export const submitAddressInfoDeclaration = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { correctionRequestId, addressData } = req.body;
    console.info("[CU-REG BACKEND] Address declaration - incoming", {
      correctionRequestId,
      addressKeys: addressData ? Object.keys(addressData) : [],
    });

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

    // Update the correction request with address info declaration
    const updatedRequest = await updateCuRegistrationCorrectionRequest(
      parseInt(correctionRequestId),
      {
        addressInfoDeclaration: true,
      },
    );
    console.info("[CU-REG BACKEND] Address declaration - request updated", {
      id: correctionRequestId,
      status: updatedRequest?.status,
      addressInfoDeclaration: (updatedRequest as any)?.addressInfoDeclaration,
    });

    // Update student address data
    if (addressData && correctionRequest.student?.id) {
      const dbUpdateResult = await updateStudentDataFromCorrectionRequest(
        correctionRequest.student.id,
        {}, // No correction flags for address
        { addressData },
      );
      console.info(
        "[CU-REG BACKEND] Address declaration - student data update result",
        dbUpdateResult,
      );

      if (!dbUpdateResult.success) {
        console.warn(
          "[ADDRESS DECLARATION] Database field updates failed:",
          dbUpdateResult.errors,
        );
      }
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { correctionRequest: updatedRequest },
          "Address info declaration submitted successfully!",
        ),
      );
  } catch (error) {
    console.error("[ADDRESS DECLARATION] Error:", error);
    handleError(error, res, next);
  }
};

// Subjects Declaration Endpoint
export const submitSubjectsDeclaration = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { correctionRequestId, flags } = req.body;
    console.info("[CU-REG BACKEND] Subjects declaration - incoming", {
      correctionRequestId,
      flags,
    });

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

    // Update the correction request with subjects declaration
    const updatedRequest = await updateCuRegistrationCorrectionRequest(
      parseInt(correctionRequestId),
      {
        subjectsDeclaration: true,
        subjectsCorrectionRequest: flags?.subjects || false,
      },
    );
    console.info("[CU-REG BACKEND] Subjects declaration - request updated", {
      id: correctionRequestId,
      status: updatedRequest?.status,
      subjectsDeclaration: (updatedRequest as any)?.subjectsDeclaration,
      subjectsCorrectionRequest: (updatedRequest as any)
        ?.subjectsCorrectionRequest,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { correctionRequest: updatedRequest },
          "Subjects declaration submitted successfully!",
        ),
      );
  } catch (error) {
    console.error("[SUBJECTS DECLARATION] Error:", error);
    handleError(error, res, next);
  }
};

// Documents Declaration Endpoint
export const submitDocumentsDeclaration = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { correctionRequestId } = req.body;
    console.info("[CU-REG BACKEND] Documents declaration - incoming", {
      correctionRequestId,
    });

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

    // Update the correction request with documents declaration
    const updatedRequest = await updateCuRegistrationCorrectionRequest(
      parseInt(correctionRequestId),
      {
        documentsDeclaration: true,
      },
    );
    console.info("[CU-REG BACKEND] Documents declaration - request updated", {
      id: correctionRequestId,
      status: updatedRequest?.status,
      documentsDeclaration: (updatedRequest as any)?.documentsDeclaration,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { correctionRequest: updatedRequest },
          "Documents declaration submitted successfully!",
        ),
      );
  } catch (error) {
    console.error("[DOCUMENTS DECLARATION] Error:", error);
    handleError(error, res, next);
  }
};
