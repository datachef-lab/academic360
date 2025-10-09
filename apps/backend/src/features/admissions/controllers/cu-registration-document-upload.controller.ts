import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { cuRegistrationDocumentUploadInsertSchema } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import {
  createCuRegistrationDocumentUpload,
  findCuRegistrationDocumentUploadById,
  findCuRegistrationDocumentUploadsByRequestId,
  findAllCuRegistrationDocumentUploads,
  updateCuRegistrationDocumentUpload,
  deleteCuRegistrationDocumentUpload,
  deleteCuRegistrationDocumentUploadsByRequestId as deleteCuRegistrationDocumentUploadsByRequestIdService,
} from "../services/cu-registration-document-upload.service.js";
import { findCuRegistrationCorrectionRequestById } from "../services/cu-registration-correction-request.service.js";
import {
  uploadToS3,
  deleteFromS3,
  getSignedUrlForFile,
  validateFileType,
  validateFileSize,
  extractS3KeyFromUrl,
  UploadConfigs,
  FileTypeConfigs,
  createStudentUploadConfig,
  StudentFolderManager,
  listStudentFiles,
  deleteAllStudentFiles as deleteAllStudentFilesFromS3,
  getStudentFolderStats,
} from "@/services/s3.service.js";
import {
  uploadToFileSystem,
  deleteFromFileSystem,
} from "@/services/filesystem-storage.service.js";
import multer from "multer";

// Configure multer for memory storage (for S3 uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize:
      UploadConfigs.CU_REGISTRATION_DOCUMENTS.maxFileSizeMB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    console.info(
      `[CU-REG DOC UPLOAD] File received: ${file.originalname}, size: ${file.size || "undefined"} bytes, type: ${file.mimetype}`,
    );

    // Validate file type using predefined config
    if (
      !validateFileType(
        file,
        UploadConfigs.CU_REGISTRATION_DOCUMENTS.allowedMimeTypes,
      )
    ) {
      return cb(
        new Error(
          `Only document files are allowed: ${UploadConfigs.CU_REGISTRATION_DOCUMENTS.allowedMimeTypes.join(", ")}`,
        ),
      );
    }

    // Skip size validation in fileFilter - multer memory storage doesn't set file.size
    // We'll validate size in the controller after the file is fully received
    console.info(
      `[CU-REG DOC UPLOAD] File type validation passed, proceeding with upload`,
    );

    cb(null, true);
  },
});

// Middleware for file upload
export const uploadMiddleware = upload.single("file");

// Create a new document upload
export const createNewCuRegistrationDocumentUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { cuRegistrationCorrectionRequestId, documentId, remarks } = req.body;
    const file = req.file;

    console.info(`[CU-REG DOC UPLOAD] Request body:`, {
      cuRegistrationCorrectionRequestId,
      documentId,
      remarks,
      cuRegistrationCorrectionRequestIdType:
        typeof cuRegistrationCorrectionRequestId,
      documentIdType: typeof documentId,
    });

    if (!file) {
      res.status(400).json(new ApiError(400, "File is required"));
      return;
    }

    // Validate file size after multer has processed the file
    const fileSizeMB = file.size / (1024 * 1024);
    const maxSizeMB = UploadConfigs.CU_REGISTRATION_DOCUMENTS.maxFileSizeMB;
    console.info(
      `[CU-REG DOC UPLOAD] Controller size check: ${fileSizeMB.toFixed(2)} MB <= ${maxSizeMB} MB = ${fileSizeMB <= maxSizeMB}`,
    );

    if (fileSizeMB > maxSizeMB) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `File size must be less than or equal to ${maxSizeMB}MB`,
          ),
        );
      return;
    }

    if (!cuRegistrationCorrectionRequestId || !documentId) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Correction request ID and document ID are required",
          ),
        );
      return;
    }

    // Get the correction request to fetch student UID
    const correctionRequest = await findCuRegistrationCorrectionRequestById(
      parseInt(cuRegistrationCorrectionRequestId),
    );
    if (!correctionRequest) {
      res.status(404).json(new ApiError(404, "Correction request not found"));
      return;
    }

    // Get student UID from the correction request
    const studentUid = correctionRequest.student.uid;
    if (!studentUid) {
      res.status(400).json(new ApiError(400, "Student UID not found"));
      return;
    }

    // Create student-specific upload configuration
    const uploadConfig = createStudentUploadConfig(
      studentUid,
      "cu-registration-documents",
      {
        maxFileSizeMB: 10,
        allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
        makePublic: false,
        metadata: {
          correctionRequestId: cuRegistrationCorrectionRequestId,
          documentId: documentId,
          remarks: remarks || "",
        },
      },
    );

    // Try to upload to S3 first, fallback to file system if S3 is not configured
    let uploadResult;
    try {
      console.info("[CU-REG DOC UPLOAD] Attempting S3 upload...");
      uploadResult = await uploadToS3(file, uploadConfig);
      console.info("[CU-REG DOC UPLOAD] S3 upload successful");
    } catch (s3Error: any) {
      if (s3Error.message?.includes("S3 service is not configured")) {
        console.info(
          "[CU-REG DOC UPLOAD] S3 not configured, falling back to file system storage",
        );
        // Get document type name for file system storage
        const documentTypeMap: Record<string, string> = {
          "1": "class-xii-marksheet",
          "2": "aadhaar-card",
          "3": "apaar-id-card",
          "4": "father-photo-id",
          "5": "mother-photo-id",
          "10": "ews-certificate",
        };
        const documentType =
          documentTypeMap[documentId] || `document-${documentId}`;
        uploadResult = await uploadToFileSystem(
          file,
          correctionRequest.cuRegistrationApplicationNumber,
          documentType,
        );
        console.info("[CU-REG DOC UPLOAD] File system upload successful");
      } else {
        throw s3Error;
      }
    }

    const documentData = {
      cuRegistrationCorrectionRequestId: parseInt(
        cuRegistrationCorrectionRequestId,
      ),
      documentId: parseInt(documentId),
      documentUrl: uploadResult.url,
      path: uploadResult.key, // Store S3 key or file system path
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      remarks: remarks || null,
    };

    // Validate request body
    const parseResult =
      cuRegistrationDocumentUploadInsertSchema.safeParse(documentData);
    if (!parseResult.success) {
      // Clean up uploaded file if validation fails
      try {
        if (uploadResult.url.startsWith("/uploads/")) {
          // File system storage
          await deleteFromFileSystem(uploadResult.key);
        } else {
          // S3 storage
          await deleteFromS3(uploadResult.key);
        }
      } catch (deleteError) {
        console.error(
          "Failed to delete file after validation error:",
          deleteError,
        );
      }
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

    const newDocument = await createCuRegistrationDocumentUpload(
      parseResult.data,
    );

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newDocument,
          "Document uploaded successfully to S3!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get document upload by ID
export const getCuRegistrationDocumentUploadById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid document ID"));
      return;
    }

    const document = await findCuRegistrationDocumentUploadById(id);

    if (!document) {
      res.status(404).json(new ApiError(404, "Document upload not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          document,
          "Document upload retrieved successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all document uploads for a correction request
export const getCuRegistrationDocumentUploadsByRequestId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const requestId = parseInt(req.params.requestId);

    if (isNaN(requestId)) {
      res.status(400).json(new ApiError(400, "Invalid request ID"));
      return;
    }

    const documents =
      await findCuRegistrationDocumentUploadsByRequestId(requestId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          documents,
          "Document uploads retrieved successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all document uploads with pagination
export const getAllCuRegistrationDocumentUploads = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const requestId = req.query.requestId
      ? parseInt(req.query.requestId as string)
      : undefined;

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

    const result = await findAllCuRegistrationDocumentUploads(
      page,
      limit,
      requestId,
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
        "Document uploads retrieved successfully!",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update document upload
export const updateCuRegistrationDocumentUploadById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid document ID"));
      return;
    }

    // Validate request body
    const parseResult = cuRegistrationDocumentUploadInsertSchema
      .partial()
      .safeParse(req.body);
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

    const updatedDocument = await updateCuRegistrationDocumentUpload(
      id,
      parseResult.data,
    );

    if (!updatedDocument) {
      res.status(404).json(new ApiError(404, "Document upload not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedDocument,
          "Document upload updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete document upload
export const deleteCuRegistrationDocumentUploadById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid document ID"));
      return;
    }

    // Get document info before deletion to clean up file from S3
    const document = await findCuRegistrationDocumentUploadById(id);
    if (!document) {
      res.status(404).json(new ApiError(404, "Document upload not found"));
      return;
    }

    const deleted = await deleteCuRegistrationDocumentUpload(id);

    if (!deleted) {
      res.status(404).json(new ApiError(404, "Document upload not found"));
      return;
    }

    // Clean up file from S3
    if (document.path) {
      try {
        await deleteFromS3(document.path);
      } catch (deleteError) {
        console.error("Failed to delete file from S3:", deleteError);
        // Don't fail the request if S3 deletion fails
      }
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Document upload deleted successfully from S3!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete all document uploads for a correction request
export const deleteCuRegistrationDocumentUploadsByRequestId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const requestId = parseInt(req.params.requestId);

    if (isNaN(requestId)) {
      res.status(400).json(new ApiError(400, "Invalid request ID"));
      return;
    }

    // Get all documents before deletion to clean up files from S3
    const documents =
      await findCuRegistrationDocumentUploadsByRequestId(requestId);

    const deleted =
      await deleteCuRegistrationDocumentUploadsByRequestIdService(requestId);

    if (!deleted) {
      res
        .status(404)
        .json(new ApiError(404, "No document uploads found for this request"));
      return;
    }

    // Clean up files from S3
    const deletePromises = documents.map(async (doc) => {
      if (doc.path) {
        try {
          await deleteFromS3(doc.path);
        } catch (deleteError) {
          console.error(
            `Failed to delete file from S3: ${doc.path}`,
            deleteError,
          );
        }
      }
    });

    await Promise.all(deletePromises);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "All document uploads deleted successfully from S3!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get signed URL for file access
export const getSignedUrlForDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const expiresIn = parseInt(req.query.expiresIn as string) || 3600; // Default 1 hour

    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid document ID"));
      return;
    }

    const document = await findCuRegistrationDocumentUploadById(id);
    if (!document) {
      res.status(404).json(new ApiError(404, "Document upload not found"));
      return;
    }

    // Filesystem fallback: when documentUrl points to our /uploads mount, just return absolute URL
    const isFilesystemUrl =
      !!document.documentUrl && document.documentUrl.startsWith("/uploads/");

    if (isFilesystemUrl) {
      const absolute = `${req.protocol}://${req.get("host")}${document.documentUrl}`;
      res.status(200).json(
        new ApiResponse(
          200,
          "SUCCESS",
          {
            signedUrl: absolute,
            expiresIn,
            documentUrl: document.documentUrl,
            fileName: document.fileName,
          },
          "Filesystem URL returned successfully!",
        ),
      );
      return;
    }

    // S3 path expected. If S3 not configured, fall back to documentUrl (if present)
    if (!document.path) {
      const absolute = document.documentUrl
        ? `${req.protocol}://${req.get("host")}${document.documentUrl}`
        : undefined;
      res.status(200).json(
        new ApiResponse(
          200,
          "SUCCESS",
          {
            signedUrl: absolute,
            expiresIn,
            documentUrl: document.documentUrl,
            fileName: document.fileName,
          },
          "Document path missing; returned documentUrl.",
        ),
      );
      return;
    }

    try {
      const signedUrl = await getSignedUrlForFile(document.path, expiresIn);

      res.status(200).json(
        new ApiResponse(
          200,
          "SUCCESS",
          {
            signedUrl,
            expiresIn,
            documentUrl: document.documentUrl,
            fileName: document.fileName,
          },
          "Signed URL generated successfully!",
        ),
      );
    } catch (error: any) {
      // Fallback to filesystem/public URL if S3 not available
      const absolute = document.documentUrl
        ? `${req.protocol}://${req.get("host")}${document.documentUrl}`
        : undefined;
      res.status(200).json(
        new ApiResponse(
          200,
          "SUCCESS",
          {
            signedUrl: absolute,
            expiresIn,
            documentUrl: document.documentUrl,
            fileName: document.fileName,
          },
          "S3 not configured; returned filesystem/public URL instead.",
        ),
      );
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all files for a specific student
export const getStudentFiles = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentUid = req.params.studentUid;
    const documentType = req.query.documentType as string;

    if (!studentUid) {
      res.status(400).json(new ApiError(400, "Student UID is required"));
      return;
    }

    if (
      documentType &&
      !StudentFolderManager.isValidDocumentType(documentType)
    ) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Invalid document type. Valid types: ${StudentFolderManager.getDocumentTypes().join(", ")}`,
          ),
        );
      return;
    }

    const files = await listStudentFiles(studentUid, documentType);

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          studentUid,
          documentType: documentType || "all",
          files,
          count: files.length,
        },
        "Student files retrieved successfully!",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get student folder statistics
export const getStudentFolderStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentUid = req.params.studentUid;

    if (!studentUid) {
      res.status(400).json(new ApiError(400, "Student UID is required"));
      return;
    }

    const stats = await getStudentFolderStats(studentUid);

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          studentUid,
          ...stats,
          folderStructure:
            StudentFolderManager.getStudentFolderInfo(studentUid),
        },
        "Student folder statistics retrieved successfully!",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete all files for a specific student
export const deleteAllStudentFiles = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentUid = req.params.studentUid;
    const documentType = req.query.documentType as string;

    if (!studentUid) {
      res.status(400).json(new ApiError(400, "Student UID is required"));
      return;
    }

    if (
      documentType &&
      !StudentFolderManager.isValidDocumentType(documentType)
    ) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Invalid document type. Valid types: ${StudentFolderManager.getDocumentTypes().join(", ")}`,
          ),
        );
      return;
    }

    const result = await deleteAllStudentFilesFromS3(studentUid, documentType);

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          studentUid,
          documentType: documentType || "all",
          deleted: result.deleted,
          failed: result.failed,
          deletedCount: result.deleted.length,
          failedCount: result.failed.length,
        },
        "Student files deleted successfully!",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};
