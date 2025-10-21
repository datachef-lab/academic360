import {
  CuRegistrationDataService,
  CuRegistrationDataOptions,
} from "./cu-registration-data.service.js";
import {
  pdfGenerationService,
  CuRegistrationFormData,
} from "./pdf-generation.service.js";
import path from "path";
import fs from "fs/promises";
import {
  uploadToS3,
  createUploadConfig,
  FileTypeConfigs,
} from "./s3.service.js";
import {
  getCuRegPdfPath,
  getCuRegPdfPathDynamic,
} from "../features/admissions/services/cu-registration-document-path.service.js";

export interface CuRegistrationPdfOptions {
  studentId: number;
  correctionRequestId: number;
  applicationNumber: string;
  studentUid: string; // Required for S3 path generation
  outputDirectory?: string;
  uploadToS3?: boolean; // Whether to upload to S3 after generation
  collegeInfo?: {
    logoUrl?: string;
    name?: string;
    address?: string;
    details1?: string;
    details2?: string;
  };
}

export class CuRegistrationPdfIntegrationService {
  public static async generateCuRegistrationPdf(
    options: CuRegistrationPdfOptions,
  ): Promise<{
    success: boolean;
    pdfPath?: string;
    s3Url?: string;
    pdfBuffer?: Buffer;
    error?: string;
  }> {
    try {
      console.info("[CU-REG PDF INTEGRATION] Starting PDF generation process", {
        studentId: options.studentId,
        correctionRequestId: options.correctionRequestId,
        applicationNumber: options.applicationNumber,
      });

      // Step 1: Fetch all required student data
      const dataOptions: CuRegistrationDataOptions = {
        studentId: options.studentId,
        correctionRequestId: options.correctionRequestId,
        applicationNumber: options.applicationNumber, // Pass the application number
        collegeLogoUrl: options.collegeInfo?.logoUrl,
        collegeName: options.collegeInfo?.name,
        collegeAddress: options.collegeInfo?.address,
        collegeDetails1: options.collegeInfo?.details1,
        collegeDetails2: options.collegeInfo?.details2,
      };

      const formData =
        await CuRegistrationDataService.fetchStudentDataForPdf(dataOptions);

      // Step 2: Generate PDF in memory (no local file storage)
      const pdfBuffer =
        await pdfGenerationService.generateCuRegistrationPdfBuffer(formData);

      if (pdfBuffer.length === 0) {
        throw new Error("Generated PDF buffer is empty");
      }

      console.info(
        "[CU-REG PDF INTEGRATION] PDF generated successfully in memory",
        {
          fileSize: pdfBuffer.length,
          applicationNumber: options.applicationNumber,
        },
      );

      // Step 3: Upload to S3 if requested
      let s3Url: string | undefined;
      if (options.uploadToS3) {
        try {
          console.info("[CU-REG PDF INTEGRATION] Uploading PDF to S3", {
            studentUid: options.studentUid,
            cuRegNumber: options.applicationNumber,
          });

          // Get S3 path configuration (with dynamic data)
          const pdfPathConfig = await getCuRegPdfPathDynamic(
            options.studentId,
            options.studentUid,
            options.applicationNumber,
          );

          console.info("[CU-REG PDF INTEGRATION] S3 path:", {
            fullPath: pdfPathConfig.fullPath,
          });

          // Create upload configuration
          const uploadConfig = createUploadConfig(pdfPathConfig.folder, {
            customFileName: pdfPathConfig.filename,
            maxFileSizeMB: 50, // PDF can be larger
            allowedMimeTypes: FileTypeConfigs.PDF_ONLY,
            makePublic: false,
            metadata: {
              studentUid: options.studentUid,
              cuRegNumber: options.applicationNumber,
              correctionRequestId: options.correctionRequestId.toString(),
              fileSize: pdfBuffer.length.toString(),
              generatedAt: new Date().toISOString(),
            },
          });

          // Create a file object for S3 upload
          const fileForUpload: Express.Multer.File = {
            fieldname: "pdf",
            originalname: pdfPathConfig.filename,
            encoding: "7bit",
            mimetype: "application/pdf",
            size: pdfBuffer.length,
            buffer: pdfBuffer,
            stream: null as any,
            destination: "",
            filename: pdfPathConfig.filename,
            path: "", // No local path since we're using buffer
          };

          // Upload to S3
          const uploadResult = await uploadToS3(fileForUpload, uploadConfig);
          s3Url = uploadResult.url;

          console.info(
            "[CU-REG PDF INTEGRATION] PDF uploaded to S3 successfully",
            {
              s3Path: pdfPathConfig.fullPath,
              s3Url,
              studentId: options.studentId,
              applicationNumber: options.applicationNumber,
              pdfBufferSize: pdfBuffer.length,
            },
          );
        } catch (s3Error) {
          console.error("[CU-REG PDF INTEGRATION] S3 upload failed:", s3Error);
          // Don't fail the entire process if S3 upload fails
          // The PDF is still available locally
        }
      }

      return {
        success: true,
        pdfPath: undefined, // No local file path since we're using memory
        s3Url,
        pdfBuffer, // Return the PDF buffer for notification
      };
    } catch (error) {
      console.error("[CU-REG PDF INTEGRATION] PDF generation failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred during PDF generation",
      };
    }
  }

  public static async generateCuRegistrationPdfForFinalSubmission(
    studentId: number,
    correctionRequestId: number,
    applicationNumber: string,
    studentUid: string,
  ): Promise<{
    success: boolean;
    pdfPath?: string;
    s3Url?: string;
    pdfBuffer?: Buffer;
    error?: string;
  }> {
    console.info(
      "[CU-REG PDF INTEGRATION] Generating PDF for final submission",
      {
        studentId,
        correctionRequestId,
        applicationNumber,
        studentUid,
      },
    );

    return await this.generateCuRegistrationPdf({
      studentId,
      correctionRequestId,
      applicationNumber,
      studentUid,
      outputDirectory: "./uploads/cu-registration-pdfs",
      uploadToS3: true, // Enable S3 upload for final submissions
      collegeInfo: {
        logoUrl: "https://besc.academic360.app/api/api/v1/settings/file/4",
        name: "The Bhawanipur Education Society College",
        address: "5, Lala Lajpat Rai Sarani, Kolkata - 700020",
        details1:
          "A Minority Run College. Affiliated to the University of Calcutta",
        details2: "Recognised under Section 2(F) & 12 (B) of the UGC Act, 1956",
      },
    });
  }

  public static async cleanupOldPdfs(
    outputDirectory: string = "./uploads/cu-registration-pdfs",
    maxAgeDays: number = 30,
  ): Promise<void> {
    try {
      console.info("[CU-REG PDF INTEGRATION] Starting cleanup of old PDFs", {
        outputDirectory,
        maxAgeDays,
      });

      const files = await fs.readdir(outputDirectory);
      const now = Date.now();
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

      let deletedCount = 0;
      let totalSize = 0;

      for (const file of files) {
        if (file.endsWith(".pdf")) {
          const filePath = path.join(outputDirectory, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            deletedCount++;
            totalSize += stats.size;
            console.info("[CU-REG PDF INTEGRATION] Deleted old PDF", {
              file,
              size: stats.size,
            });
          }
        }
      }

      console.info("[CU-REG PDF INTEGRATION] Cleanup completed", {
        deletedCount,
        totalSizeFreed: totalSize,
      });
    } catch (error) {
      console.error("[CU-REG PDF INTEGRATION] Cleanup failed:", error);
      // Don't throw error for cleanup failures
    }
  }
}
