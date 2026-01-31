// File upload related types
export interface FileUploadRequest {
  file: Express.Multer.File;
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  data?: {
    fileName: string;
    fileSize: number;
    fileType: string;
    s3Key: string;
    s3Url: string;
    uploadedAt: string;
  };
  error?: string;
}

export interface FileValidationConfig {
  maxFileSizeMB: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export interface S3UploadConfig {
  folder: string;
  customFileName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}
