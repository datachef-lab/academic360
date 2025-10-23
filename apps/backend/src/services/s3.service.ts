import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ApiError } from "@/utils/ApiError.js";

// S3 Configuration Interface
export interface S3Config {
  region?: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

// File Upload Configuration
export interface UploadConfig {
  folder?: string;
  customFileName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  makePublic?: boolean;
  maxFileSizeMB?: number;
  allowedMimeTypes?: string[];
  // Student-specific folder structure
  studentUid?: string;
  documentType?:
    | "cu-registration-documents"
    | "application-form-docs"
    | "marksheets"
    | "others";
}

// Initialize S3 client with configuration
function createS3Client(config?: Partial<S3Config>): S3Client | null {
  const s3Config: S3Config = {
    region: config?.region || process.env.AWS_REGION || "ap-south-1",
    bucket: config?.bucket || process.env.AWS_S3_BUCKET || "",
    accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey:
      config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "",
  };

  if (!s3Config.bucket) {
    console.warn(
      "⚠️  S3 bucket name not configured. Set AWS_S3_BUCKET environment variable or provide bucket in config.",
    );
    return null;
  }

  if (!s3Config.accessKeyId || !s3Config.secretAccessKey) {
    console.warn(
      "⚠️  AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables or provide them in config.",
    );
    return null;
  }

  return new S3Client({
    region: s3Config.region,
    credentials: {
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
    },
  });
}

// Default S3 client instance (null if AWS credentials not configured)
const defaultS3Client = createS3Client();
const defaultBucket = process.env.AWS_S3_BUCKET || "";

export interface S3UploadResult {
  key: string;
  url: string;
  bucket: string;
}

export interface S3FileInfo {
  key: string;
  bucket: string;
  url: string;
  signedUrl?: string;
}

/**
 * Upload a file to S3 with configurable options
 */
export async function uploadToS3(
  file: Express.Multer.File,
  config?: UploadConfig,
  s3Config?: Partial<S3Config>,
): Promise<S3UploadResult> {
  try {
    const s3Client = s3Config ? createS3Client(s3Config) : defaultS3Client;

    if (!s3Client) {
      throw new ApiError(
        500,
        "S3 service is not configured. Please set AWS environment variables.",
      );
    }

    const bucket = s3Config?.bucket || defaultBucket;
    const region = s3Config?.region || process.env.AWS_REGION || "ap-south-1";

    // Validate file if validation is enabled
    if (
      config?.allowedMimeTypes &&
      !config.allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new ApiError(400, `File type ${file.mimetype} is not allowed`);
    }

    if (config?.maxFileSizeMB && getFileSizeInMB(file) > config.maxFileSizeMB) {
      throw new ApiError(
        400,
        `File size exceeds maximum allowed size of ${config.maxFileSizeMB}MB`,
      );
    }

    // Generate file name
    const fileExtension = file.originalname.split(".").pop();
    const fileName =
      config?.customFileName ||
      `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;

    // Use student-specific folder structure if studentUid is provided
    let folder = config?.folder || "uploads";
    if (config?.studentUid && config?.documentType) {
      folder = StudentFolderManager.getStudentFolderPath(
        config.studentUid,
        config.documentType,
      );
    }

    // Optional root folder support (prefix everything under this folder inside the bucket)
    const root = (process.env.AWS_ROOT_FOLDER || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");

    // Check if the folder already contains the root folder prefix to avoid double prefixing
    let finalFolder = folder;
    if (root && !folder.startsWith(`${root}/`)) {
      finalFolder = `${root}/${folder}`;
    }

    const key = `${finalFolder}/${fileName}`.replace(/\/{2,}/g, "/");

    // Prepare upload parameters
    const uploadParams: any = {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: config?.contentType || file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
        ...config?.metadata,
      },
    };

    // Set ACL if file should be public
    if (config?.makePublic) {
      uploadParams.ACL = "public-read";
    }

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return {
      key,
      url,
      bucket,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to upload file to S3");
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(
  key: string,
  s3Config?: Partial<S3Config>,
): Promise<boolean> {
  try {
    const s3Client = s3Config ? createS3Client(s3Config) : defaultS3Client;

    if (!s3Client) {
      throw new ApiError(
        500,
        "S3 service is not configured. Please set AWS environment variables.",
      );
    }

    const bucket = s3Config?.bucket || defaultBucket;

    const deleteParams = {
      Bucket: bucket,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    return true;
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new ApiError(500, "Failed to delete file from S3");
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrlForFile(
  key: string,
  expiresIn: number = 3600,
  s3Config?: Partial<S3Config>,
): Promise<string> {
  try {
    const s3Client = s3Config ? createS3Client(s3Config) : defaultS3Client;

    if (!s3Client) {
      throw new ApiError(
        500,
        "S3 service is not configured. Please set AWS environment variables.",
      );
    }

    const bucket = s3Config?.bucket || defaultBucket;

    // Apply the same root folder logic as upload functions
    const root = (process.env.AWS_ROOT_FOLDER || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");

    // Check if the key already contains the root folder prefix to avoid double prefixing
    let finalKey = key;
    if (root && !key.startsWith(`${root}/`)) {
      finalKey = `${root}/${key}`;
    }

    console.info(`[S3 SERVICE] Generating signed URL:`, {
      originalKey: key,
      rootFolder: root,
      finalKey: finalKey,
      bucket: bucket,
    });

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: finalKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new ApiError(500, "Failed to generate signed URL");
  }
}

/**
 * Extract S3 key from URL
 */
export function extractS3KeyFromUrl(
  url: string,
  bucketName?: string,
): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Remove leading slash and extract key
    const key = pathname.substring(1);

    // Validate that it's from the specified bucket (or default bucket)
    const expectedBucket = bucketName || defaultBucket;
    if (urlObj.hostname.includes(expectedBucket)) {
      return key;
    }

    return null;
  } catch (error) {
    console.error("Error extracting S3 key from URL:", error);
    return null;
  }
}

/**
 * Get file info from S3 URL
 */
export function getS3FileInfo(
  url: string,
  bucketName?: string,
): S3FileInfo | null {
  const key = extractS3KeyFromUrl(url, bucketName);

  if (!key) {
    return null;
  }

  return {
    key,
    bucket: bucketName || defaultBucket,
    url,
  };
}

/**
 * List files in a folder
 */
export async function listFilesInFolder(
  folder: string,
  s3Config?: Partial<S3Config>,
): Promise<string[]> {
  try {
    const s3Client = s3Config ? createS3Client(s3Config) : defaultS3Client;

    if (!s3Client) {
      throw new ApiError(
        500,
        "S3 service is not configured. Please set AWS environment variables.",
      );
    }

    const bucket = s3Config?.bucket || defaultBucket;

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: folder,
    });

    const response = await s3Client.send(command);
    return response.Contents?.map((obj) => obj.Key || "") || [];
  } catch (error) {
    console.error("Error listing files in folder:", error);
    throw new ApiError(500, "Failed to list files in folder");
  }
}

/**
 * Delete multiple files from S3
 */
export async function deleteMultipleFiles(
  keys: string[],
  s3Config?: Partial<S3Config>,
): Promise<{ deleted: string[]; failed: string[] }> {
  const deleted: string[] = [];
  const failed: string[] = [];

  const deletePromises = keys.map(async (key) => {
    try {
      await deleteFromS3(key, s3Config);
      deleted.push(key);
    } catch (error) {
      console.error(`Failed to delete file ${key}:`, error);
      failed.push(key);
    }
  });

  await Promise.all(deletePromises);

  return { deleted, failed };
}

/**
 * List all files for a specific student
 */
export async function listStudentFiles(
  studentUid: string,
  documentType?: string,
  s3Config?: Partial<S3Config>,
): Promise<string[]> {
  try {
    const s3Client = s3Config ? createS3Client(s3Config) : defaultS3Client;

    if (!s3Client) {
      throw new ApiError(
        500,
        "S3 service is not configured. Please set AWS environment variables.",
      );
    }

    const bucket = s3Config?.bucket || defaultBucket;

    let prefix: string;
    if (documentType) {
      prefix = StudentFolderManager.getStudentFolderPath(
        studentUid,
        documentType,
      );
    } else {
      prefix = `students/${studentUid}/`;
    }

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return response.Contents?.map((obj) => obj.Key || "") || [];
  } catch (error) {
    console.error("Error listing student files:", error);
    throw new ApiError(500, "Failed to list student files");
  }
}

/**
 * Delete all files for a specific student
 */
export async function deleteAllStudentFiles(
  studentUid: string,
  documentType?: string,
  s3Config?: Partial<S3Config>,
): Promise<{ deleted: string[]; failed: string[] }> {
  try {
    const files = await listStudentFiles(studentUid, documentType, s3Config);
    return await deleteMultipleFiles(files, s3Config);
  } catch (error) {
    console.error("Error deleting student files:", error);
    throw new ApiError(500, "Failed to delete student files");
  }
}

/**
 * Get student folder statistics
 */
export async function getStudentFolderStats(
  studentUid: string,
  s3Config?: Partial<S3Config>,
): Promise<{
  totalFiles: number;
  totalSize: number;
  documentTypes: Record<string, { count: number; size: number }>;
}> {
  try {
    const s3Client = s3Config ? createS3Client(s3Config) : defaultS3Client;

    if (!s3Client) {
      throw new ApiError(
        500,
        "S3 service is not configured. Please set AWS environment variables.",
      );
    }

    const bucket = s3Config?.bucket || defaultBucket;

    const prefix = `students/${studentUid}/`;
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    const files = response.Contents || [];

    let totalFiles = 0;
    let totalSize = 0;
    const documentTypes: Record<string, { count: number; size: number }> = {};

    files.forEach((file) => {
      if (file.Key) {
        totalFiles++;
        totalSize += file.Size || 0;

        // Extract document type from path
        const pathParts = file.Key.split("/");
        if (pathParts.length >= 3) {
          const docType = pathParts[2]; // students/{uid}/{docType}/...
          if (!documentTypes[docType]) {
            documentTypes[docType] = { count: 0, size: 0 };
          }
          documentTypes[docType].count++;
          documentTypes[docType].size += file.Size || 0;
        }
      }
    });

    return {
      totalFiles,
      totalSize,
      documentTypes,
    };
  } catch (error) {
    console.error("Error getting student folder stats:", error);
    throw new ApiError(500, "Failed to get student folder statistics");
  }
}

/**
 * Validate file type for S3 upload
 */
export function validateFileType(
  file: Express.Multer.File,
  allowedTypes?: string[],
): boolean {
  const defaultAllowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];

  const typesToCheck = allowedTypes || defaultAllowedTypes;
  return typesToCheck.includes(file.mimetype);
}

/**
 * Get file size in MB
 */
export function getFileSizeInMB(file: Express.Multer.File): number {
  return file.size / (1024 * 1024);
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: Express.Multer.File,
  maxSizeMB: number = 10,
): boolean {
  return getFileSizeInMB(file) <= maxSizeMB;
}

/**
 * Predefined file type configurations for common use cases
 */
export const FileTypeConfigs = {
  // Document uploads (CU registration, etc.)
  DOCUMENTS: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],

  // Profile images
  IMAGES: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],

  // PDF only
  PDF_ONLY: ["application/pdf"],

  // Spreadsheets
  SPREADSHEETS: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],

  // Word documents
  WORD_DOCS: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

/**
 * DEPRECATED: Use domain-specific path services instead
 * This class is kept for backward compatibility only
 */
export class StudentFolderManager {
  /**
   * @deprecated Use domain-specific services for path generation
   */
  static getStudentFolderPath(
    studentUid: string,
    documentType: string,
  ): string {
    return `students/${studentUid}/${documentType}`;
  }
}

/**
 * Predefined upload configurations for common use cases
 */
export const UploadConfigs = {
  // CU Registration Documents (legacy - use createStudentUploadConfig instead)
  CU_REGISTRATION_DOCUMENTS: {
    folder: "cu-registration-documents",
    maxFileSizeMB: 10,
    allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
    makePublic: false,
  },

  // Profile Images
  PROFILE_IMAGES: {
    folder: "profile-images",
    maxFileSizeMB: 5,
    allowedMimeTypes: FileTypeConfigs.IMAGES,
    makePublic: true,
  },

  // General Documents
  GENERAL_DOCUMENTS: {
    folder: "documents",
    maxFileSizeMB: 10,
    allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
    makePublic: false,
  },

  // Public Assets
  PUBLIC_ASSETS: {
    folder: "public-assets",
    maxFileSizeMB: 20,
    allowedMimeTypes: [...FileTypeConfigs.IMAGES, ...FileTypeConfigs.PDF_ONLY],
    makePublic: true,
  },
};

/**
 * Create upload configuration with a specific folder path
 * This is the main function to use - folder path should be provided by domain services
 */
export function createUploadConfig(
  folder: string,
  options?: {
    customFileName?: string;
    maxFileSizeMB?: number;
    allowedMimeTypes?: string[];
    makePublic?: boolean;
    metadata?: Record<string, string>;
  },
): UploadConfig {
  return {
    folder,
    customFileName: options?.customFileName,
    maxFileSizeMB: options?.maxFileSizeMB || 10,
    allowedMimeTypes: options?.allowedMimeTypes || FileTypeConfigs.DOCUMENTS,
    makePublic: options?.makePublic || false,
    metadata: {
      uploadedAt: new Date().toISOString(),
      ...options?.metadata,
    },
  };
}

/**
 * @deprecated Use createUploadConfig with path from domain service instead
 * Create student-specific upload configuration (kept for backward compatibility)
 */
export function createStudentUploadConfig(
  studentUid: string,
  documentType: string,
  options?: {
    maxFileSizeMB?: number;
    allowedMimeTypes?: string[];
    makePublic?: boolean;
    customFileName?: string;
    metadata?: Record<string, string>;
  },
): UploadConfig {
  const folder = StudentFolderManager.getStudentFolderPath(
    studentUid,
    documentType,
  );

  return createUploadConfig(folder, {
    ...options,
    metadata: {
      studentUid,
      documentType,
      ...options?.metadata,
    },
  });
}
