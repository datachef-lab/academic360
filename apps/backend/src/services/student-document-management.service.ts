/**
 * Student Document Management Service
 *
 * This service demonstrates how to use the student folder structure
 * for managing different types of student documents.
 */

import {
  createStudentUploadConfig,
  uploadToS3,
  deleteFromS3,
  getSignedUrlForFile,
  listStudentFiles,
  deleteAllStudentFiles,
  getStudentFolderStats,
  StudentFolderManager,
  FileTypeConfigs,
} from "@/services/s3.service.js";

export class StudentDocumentManagementService {
  /**
   * Upload CU Registration Document
   */
  static async uploadCuRegistrationDocument(
    file: Express.Multer.File,
    studentUid: string,
    metadata?: Record<string, string>,
  ) {
    const uploadConfig = createStudentUploadConfig(
      studentUid,
      "cu-registration-documents",
      {
        maxFileSizeMB: 10,
        allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
        makePublic: false,
        metadata: {
          documentCategory: "cu-registration",
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      },
    );

    return await uploadToS3(file, uploadConfig);
  }

  /**
   * Upload Application Form Document
   */
  static async uploadApplicationFormDocument(
    file: Express.Multer.File,
    studentUid: string,
    metadata?: Record<string, string>,
  ) {
    const uploadConfig = createStudentUploadConfig(
      studentUid,
      "application-form-docs",
      {
        maxFileSizeMB: 10,
        allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
        makePublic: false,
        metadata: {
          documentCategory: "application-form",
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      },
    );

    return await uploadToS3(file, uploadConfig);
  }

  /**
   * Upload Marksheet
   */
  static async uploadMarksheet(
    file: Express.Multer.File,
    studentUid: string,
    semester?: string,
    metadata?: Record<string, string>,
  ) {
    const uploadConfig = createStudentUploadConfig(studentUid, "marksheets", {
      maxFileSizeMB: 10,
      allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
      makePublic: false,
      metadata: {
        documentCategory: "marksheet",
        semester: semester || "unknown",
        uploadedAt: new Date().toISOString(),
        ...metadata,
      },
    });

    return await uploadToS3(file, uploadConfig);
  }

  /**
   * Upload Other Document
   */
  static async uploadOtherDocument(
    file: Express.Multer.File,
    studentUid: string,
    category: string,
    metadata?: Record<string, string>,
  ) {
    const uploadConfig = createStudentUploadConfig(studentUid, "others", {
      maxFileSizeMB: 10,
      allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
      makePublic: false,
      metadata: {
        documentCategory: category,
        uploadedAt: new Date().toISOString(),
        ...metadata,
      },
    });

    return await uploadToS3(file, uploadConfig);
  }

  /**
   * Get all documents for a student
   */
  static async getStudentDocuments(studentUid: string) {
    const allFiles = await listStudentFiles(studentUid);
    const stats = await getStudentFolderStats(studentUid);

    return {
      studentUid,
      files: allFiles,
      statistics: stats,
      // Folder structure removed - using new CU registration path service
    };
  }

  /**
   * Get documents by type for a student
   */
  static async getStudentDocumentsByType(
    studentUid: string,
    documentType:
      | "cu-registration-documents"
      | "application-form-docs"
      | "marksheets"
      | "others",
  ) {
    const files = await listStudentFiles(studentUid, documentType);

    return {
      studentUid,
      documentType,
      files,
      count: files.length,
    };
  }

  /**
   * Get signed URL for a student document
   */
  static async getStudentDocumentSignedUrl(
    fileKey: string,
    expiresIn: number = 3600,
  ) {
    return await getSignedUrlForFile(fileKey, expiresIn);
  }

  /**
   * Delete a specific student document
   */
  static async deleteStudentDocument(fileKey: string) {
    return await deleteFromS3(fileKey);
  }

  /**
   * Delete all documents for a student
   */
  static async deleteAllStudentDocuments(studentUid: string) {
    return await deleteAllStudentFiles(studentUid);
  }

  /**
   * Delete documents by type for a student
   */
  static async deleteStudentDocumentsByType(
    studentUid: string,
    documentType:
      | "cu-registration-documents"
      | "application-form-docs"
      | "marksheets"
      | "others",
  ) {
    return await deleteAllStudentFiles(studentUid, documentType);
  }

  /**
   * Get student folder statistics
   */
  static async getStudentFolderStatistics(studentUid: string) {
    return await getStudentFolderStats(studentUid);
  }

  /**
   * Validate student UID format (customize as needed)
   */
  static validateStudentUid(studentUid: string): boolean {
    // Example validation - customize based on your UID format
    return /^[A-Z0-9]{6,12}$/.test(studentUid);
  }

  /**
   * Get document type from file path
   */
  static getDocumentTypeFromPath(filePath: string): string | null {
    const pathParts = filePath.split("/");
    if (pathParts.length >= 3 && pathParts[0] === "students") {
      return pathParts[2]; // students/{uid}/{type}/...
    }
    return null;
  }

  /**
   * Get student UID from file path
   */
  static getStudentUidFromPath(filePath: string): string | null {
    const pathParts = filePath.split("/");
    if (pathParts.length >= 2 && pathParts[0] === "students") {
      return pathParts[1]; // students/{uid}/...
    }
    return null;
  }

  /**
   * Bulk upload documents for a student
   */
  static async bulkUploadStudentDocuments(
    files: Express.Multer.File[],
    studentUid: string,
    documentType:
      | "cu-registration-documents"
      | "application-form-docs"
      | "marksheets"
      | "others",
    metadata?: Record<string, string>,
  ) {
    const uploadPromises = files.map(async (file, index) => {
      const uploadConfig = createStudentUploadConfig(studentUid, documentType, {
        maxFileSizeMB: 10,
        allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
        makePublic: false,
        customFileName: `${documentType}-${index + 1}-${Date.now()}.${file.originalname.split(".").pop()}`,
        metadata: {
          documentCategory: documentType,
          bulkUpload: "true",
          uploadIndex: index.toString(),
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      });

      return await uploadToS3(file, uploadConfig);
    });

    return await Promise.all(uploadPromises);
  }

  /**
   * Archive student documents (move to archive folder)
   */
  static async archiveStudentDocuments(
    studentUid: string,
    documentType?:
      | "cu-registration-documents"
      | "application-form-docs"
      | "marksheets"
      | "others",
  ) {
    const files = await listStudentFiles(studentUid, documentType);

    // This would require implementing a move/copy function in S3 service
    // For now, this is a placeholder for the archive functionality
    console.log(
      `Would archive ${files.length} files for student ${studentUid}`,
    );

    return {
      studentUid,
      documentType: documentType || "all",
      filesToArchive: files,
      count: files.length,
    };
  }

  /**
   * Get document summary for a student
   */
  static async getStudentDocumentSummary(studentUid: string) {
    const stats = await getStudentFolderStats(studentUid);
    // Folder info removed - using new CU registration path service

    return {
      studentUid,
      totalFiles: stats.totalFiles,
      totalSize: stats.totalSize,
      totalSizeMB: Math.round((stats.totalSize / (1024 * 1024)) * 100) / 100,
      documentTypes: stats.documentTypes,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Example usage functions
export class StudentDocumentExamples {
  /**
   * Example: Complete document upload workflow
   * Note: This is an example function. In real usage, you would pass actual file objects.
   */
  static async completeUploadWorkflow(
    file: Express.Multer.File,
    studentUid: string = "STU001",
  ) {
    // 1. Upload CU registration document
    const cuRegistrationResult =
      await StudentDocumentManagementService.uploadCuRegistrationDocument(
        file, // Express.Multer.File
        studentUid,
        { correctionRequestId: "123", documentId: "456" },
      );

    // 2. Upload marksheet
    const marksheetResult =
      await StudentDocumentManagementService.uploadMarksheet(
        file, // Express.Multer.File
        studentUid,
        "Semester 1",
        { academicYear: "2023-24" },
      );

    // 3. Get student document summary
    const summary =
      await StudentDocumentManagementService.getStudentDocumentSummary(
        studentUid,
      );

    return {
      cuRegistration: cuRegistrationResult,
      marksheet: marksheetResult,
      summary,
    };
  }

  /**
   * Example: Document retrieval workflow
   */
  static async documentRetrievalWorkflow(studentUid: string) {
    // 1. Get all documents
    const allDocuments =
      await StudentDocumentManagementService.getStudentDocuments(studentUid);

    // 2. Get specific document type
    const cuRegistrationDocs =
      await StudentDocumentManagementService.getStudentDocumentsByType(
        studentUid,
        "cu-registration-documents",
      );

    // 3. Generate signed URLs for private documents
    const signedUrls = await Promise.all(
      cuRegistrationDocs.files.map((fileKey) =>
        StudentDocumentManagementService.getStudentDocumentSignedUrl(
          fileKey,
          3600,
        ),
      ),
    );

    return {
      allDocuments,
      cuRegistrationDocs,
      signedUrls,
    };
  }
}
