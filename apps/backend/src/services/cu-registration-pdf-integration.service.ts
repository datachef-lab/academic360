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

export interface CuRegistrationPdfOptions {
  studentId: number;
  correctionRequestId: number;
  applicationNumber: string;
  outputDirectory?: string;
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

      // Step 2: Generate PDF with proper naming
      const outputDir =
        options.outputDirectory || "./uploads/cu-registration-pdfs";
      const pdfPath =
        await pdfGenerationService.generateCuRegistrationPdfWithNaming(
          formData,
          options.applicationNumber,
          outputDir,
        );

      // Step 3: Verify PDF was created successfully
      try {
        await fs.access(pdfPath);
        const stats = await fs.stat(pdfPath);

        if (stats.size === 0) {
          throw new Error("Generated PDF file is empty");
        }

        console.info("[CU-REG PDF INTEGRATION] PDF generated successfully", {
          pdfPath,
          fileSize: stats.size,
          applicationNumber: options.applicationNumber,
        });

        return {
          success: true,
          pdfPath,
        };
      } catch (fileError) {
        console.error(
          "[CU-REG PDF INTEGRATION] PDF file verification failed:",
          fileError,
        );
        throw new Error(
          `PDF file verification failed: ${fileError instanceof Error ? fileError.message : "Unknown error"}`,
        );
      }
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
  ): Promise<{
    success: boolean;
    pdfPath?: string;
    error?: string;
  }> {
    console.info(
      "[CU-REG PDF INTEGRATION] Generating PDF for final submission",
      {
        studentId,
        correctionRequestId,
        applicationNumber,
      },
    );

    return await this.generateCuRegistrationPdf({
      studentId,
      correctionRequestId,
      applicationNumber,
      outputDirectory: "./uploads/cu-registration-pdfs",
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
