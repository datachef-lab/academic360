/**
 * Example service showing how to use the generic S3 service for different features
 * This file demonstrates various use cases and can be used as a reference
 */

import {
  uploadToS3,
  deleteFromS3,
  getSignedUrlForFile,
  listFilesInFolder,
  deleteMultipleFiles,
  UploadConfigs,
  FileTypeConfigs,
  UploadConfig,
  S3Config,
} from "@/services/s3.service.js";

// Example 1: Profile Image Upload Service
export class ProfileImageService {
  private static readonly UPLOAD_CONFIG: UploadConfig = {
    folder: "profile-images",
    maxFileSizeMB: 5,
    allowedMimeTypes: FileTypeConfigs.IMAGES,
    makePublic: true, // Profile images are typically public
    metadata: {
      feature: "profile-image",
      version: "1.0",
    },
  };

  static async uploadProfileImage(file: Express.Multer.File, userId: string) {
    const customFileName = `profile-${userId}-${Date.now()}.${file.originalname.split(".").pop()}`;

    const config = {
      ...this.UPLOAD_CONFIG,
      customFileName,
      metadata: {
        ...this.UPLOAD_CONFIG.metadata,
        userId,
        uploadedAt: new Date().toISOString(),
      },
    };

    return await uploadToS3(file, config);
  }

  static async deleteProfileImage(imageKey: string) {
    return await deleteFromS3(imageKey);
  }

  static async getProfileImageUrl(imageKey: string, expiresIn: number = 3600) {
    return await getSignedUrlForFile(imageKey, expiresIn);
  }
}

// Example 2: Document Archive Service
export class DocumentArchiveService {
  private static readonly UPLOAD_CONFIG: UploadConfig = {
    folder: "document-archives",
    maxFileSizeMB: 100, // Large files allowed
    allowedMimeTypes: [
      ...FileTypeConfigs.DOCUMENTS,
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
    ],
    makePublic: false,
    metadata: {
      feature: "document-archive",
      version: "1.0",
    },
  };

  static async uploadArchive(file: Express.Multer.File, category: string) {
    const customFileName = `archive-${category}-${Date.now()}.${file.originalname.split(".").pop()}`;

    const config = {
      ...this.UPLOAD_CONFIG,
      customFileName,
      metadata: {
        ...this.UPLOAD_CONFIG.metadata,
        category,
        uploadedAt: new Date().toISOString(),
      },
    };

    return await uploadToS3(file, config);
  }

  static async listArchivesByCategory(category: string) {
    return await listFilesInFolder(`document-archives/archive-${category}`);
  }

  static async deleteArchive(archiveKey: string) {
    return await deleteFromS3(archiveKey);
  }
}

// Example 3: Multi-bucket Service (using different S3 buckets)
export class MultiBucketService {
  private static readonly PRODUCTION_BUCKET: S3Config = {
    bucket: "production-bucket",
    region: "ap-south-1",
  };

  private static readonly STAGING_BUCKET: S3Config = {
    bucket: "staging-bucket",
    region: "ap-south-1",
  };

  static async uploadToProduction(file: Express.Multer.File, folder: string) {
    const config: UploadConfig = {
      folder,
      maxFileSizeMB: 10,
      allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
      makePublic: false,
    };

    return await uploadToS3(file, config, this.PRODUCTION_BUCKET);
  }

  static async uploadToStaging(file: Express.Multer.File, folder: string) {
    const config: UploadConfig = {
      folder,
      maxFileSizeMB: 10,
      allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
      makePublic: true, // Staging files can be public
    };

    return await uploadToS3(file, config, this.STAGING_BUCKET);
  }
}

// Example 4: Bulk Operations Service
export class BulkOperationsService {
  static async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string,
  ) {
    const uploadPromises = files.map(async (file, index) => {
      const config: UploadConfig = {
        folder,
        customFileName: `bulk-${index}-${Date.now()}.${file.originalname.split(".").pop()}`,
        maxFileSizeMB: 5,
        allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
        makePublic: false,
      };

      return await uploadToS3(file, config);
    });

    return await Promise.all(uploadPromises);
  }

  static async deleteMultipleFilesByPattern(folder: string, pattern: string) {
    const files = await listFilesInFolder(folder);
    const filesToDelete = files.filter((file) => file.includes(pattern));

    return await deleteMultipleFiles(filesToDelete);
  }

  static async cleanupOldFiles(folder: string, olderThanDays: number = 30) {
    const files = await listFilesInFolder(folder);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const filesToDelete = files.filter((file) => {
      // Extract timestamp from filename (assuming format: timestamp-random.ext)
      const timestamp = parseInt(file.split("-")[0]);
      const fileDate = new Date(timestamp);
      return fileDate < cutoffDate;
    });

    return await deleteMultipleFiles(filesToDelete);
  }
}

// Example 5: Custom File Type Service
export class CustomFileTypeService {
  private static readonly VIDEO_CONFIG: UploadConfig = {
    folder: "videos",
    maxFileSizeMB: 500, // Large video files
    allowedMimeTypes: [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      "video/webm",
    ],
    makePublic: false,
    metadata: {
      feature: "video-upload",
      version: "1.0",
    },
  };

  private static readonly AUDIO_CONFIG: UploadConfig = {
    folder: "audio",
    maxFileSizeMB: 50,
    allowedMimeTypes: [
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/m4a",
      "audio/aac",
    ],
    makePublic: false,
    metadata: {
      feature: "audio-upload",
      version: "1.0",
    },
  };

  static async uploadVideo(file: Express.Multer.File, title: string) {
    const customFileName = `video-${title.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.${file.originalname.split(".").pop()}`;

    const config = {
      ...this.VIDEO_CONFIG,
      customFileName,
      metadata: {
        ...this.VIDEO_CONFIG.metadata,
        title,
        uploadedAt: new Date().toISOString(),
      },
    };

    return await uploadToS3(file, config);
  }

  static async uploadAudio(file: Express.Multer.File, title: string) {
    const customFileName = `audio-${title.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.${file.originalname.split(".").pop()}`;

    const config = {
      ...this.AUDIO_CONFIG,
      customFileName,
      metadata: {
        ...this.AUDIO_CONFIG.metadata,
        title,
        uploadedAt: new Date().toISOString(),
      },
    };

    return await uploadToS3(file, config);
  }
}

// Example 6: Using Predefined Configurations
export class PredefinedConfigService {
  // Use existing predefined configurations
  static async uploadCuRegistrationDocument(file: Express.Multer.File) {
    return await uploadToS3(file, UploadConfigs.CU_REGISTRATION_DOCUMENTS);
  }

  static async uploadProfileImage(file: Express.Multer.File) {
    return await uploadToS3(file, UploadConfigs.PROFILE_IMAGES);
  }

  static async uploadGeneralDocument(file: Express.Multer.File) {
    return await uploadToS3(file, UploadConfigs.GENERAL_DOCUMENTS);
  }

  static async uploadPublicAsset(file: Express.Multer.File) {
    return await uploadToS3(file, UploadConfigs.PUBLIC_ASSETS);
  }
}
