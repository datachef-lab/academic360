import { Request, Response } from "express";
import multer from "multer";
import { uploadToS3 } from "@/services/s3.service.js";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import type {
  FileUploadResponse,
  FileValidationConfig,
} from "@/types/express/file-upload.d.js";

// File validation configuration
const FILE_VALIDATION_CONFIG: FileValidationConfig = {
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "2"),
  allowedMimeTypes: ["application/pdf"],
  allowedExtensions: [".pdf"],
};

// Multer configuration for memory storage (required for S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_VALIDATION_CONFIG.maxFileSizeMB * 1024 * 1024, // Convert MB to bytes
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (!FILE_VALIDATION_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new ApiError(400, `Invalid file type. Only PDF files are allowed.`),
      );
    }

    // Check file extension
    const fileExtension = file.originalname.toLowerCase().split(".").pop();
    if (
      !fileExtension ||
      !FILE_VALIDATION_CONFIG.allowedExtensions.includes(`.${fileExtension}`)
    ) {
      return cb(
        new ApiError(
          400,
          `Invalid file extension. Only .pdf files are allowed.`,
        ),
      );
    }

    cb(null, true);
  },
});

export const cuFormUploadController = {
  /**
   * Upload CU Semester I Examination Form to S3
   */
  uploadForm: [
    upload.single("file"),
    async (req: Request, res: Response): Promise<void> => {
      try {
        // Check if file was uploaded
        if (!req.file) {
          throw new ApiError(
            400,
            "No file uploaded. Please select a PDF file to upload.",
          );
        }

        const file = req.file;

        // Additional validation
        if (file.size === 0) {
          throw new ApiError(
            400,
            "Uploaded file is empty. Please select a valid PDF file.",
          );
        }

        // Validate file size (double check)
        if (file.size > FILE_VALIDATION_CONFIG.maxFileSizeMB * 1024 * 1024) {
          throw new ApiError(
            400,
            `File size exceeds maximum allowed size of ${FILE_VALIDATION_CONFIG.maxFileSizeMB}MB`,
          );
        }

        // Generate unique filename with timestamp and original extension
        const timestamp = Date.now();
        const randomId = Math.round(Math.random() * 1e9);
        const fileExtension = file.originalname.split(".").pop();
        const customFileName = `cu-form-${timestamp}-${randomId}.${fileExtension}`;

        // Upload to S3
        const s3Result = await uploadToS3(file, {
          folder: "cu-forms",
          customFileName,
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedBy: String((req.user as { id: number })?.id || "anonymous"),
            uploadType: "cu-semester-form",
            uploadTimestamp: new Date().toISOString(),
          },
        });

        // Prepare response
        const response: FileUploadResponse = {
          success: true,
          message: "CU Semester I Examination Form uploaded successfully",
          data: {
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            s3Key: s3Result.key,
            s3Url: s3Result.url,
            uploadedAt: new Date().toISOString(),
          },
        };

        res
          .status(200)
          .json(
            new ApiResponse(
              200,
              "SUCCESS",
              response,
              "File uploaded successfully",
            ),
          );
      } catch (error) {
        console.error("CU Form upload error:", error);

        if (error instanceof ApiError) {
          const response: FileUploadResponse = {
            success: false,
            message: "File upload failed",
            error: error.message,
          };
          res
            .status(error.statusCode)
            .json(
              new ApiResponse(
                error.statusCode,
                "ERROR",
                response,
                error.message,
              ),
            );
        } else {
          const response: FileUploadResponse = {
            success: false,
            message: "File upload failed",
            error: "An unexpected error occurred during file upload",
          };
          res
            .status(500)
            .json(
              new ApiResponse(500, "ERROR", response, "Internal server error"),
            );
        }
      }
    },
  ],
};
