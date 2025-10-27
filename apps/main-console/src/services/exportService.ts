import axiosInstance from "@/utils/api";

export interface ExportResponse {
  success: boolean;
  message: string;
  data?: {
    downloadUrl: string;
    fileName: string;
    totalRecords: number;
  };
}

export class ExportService {
  /**
   * Export student subject selections to Excel
   * @param subjectSelectionMetaId - The subject selection meta ID to export
   * @returns Promise with export response
   */
  static async exportStudentSubjectSelections(subjectSelectionMetaId: number): Promise<ExportResponse> {
    try {
      // Backend mounts this router at /api/subject-selection/student-subject-selection
      // and the route path is GET /export/:subjectSelectionMetaId
      const response = await axiosInstance.get(
        `/api/subject-selection/student-subject-selection/export/${subjectSelectionMetaId}`,
        {
          responseType: "blob", // Important for file downloads
        },
      );

      // Extract filename from response headers
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `student_subject_selections_${subjectSelectionMetaId}.xlsx`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      // Create download URL
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = URL.createObjectURL(blob);

      return {
        success: true,
        message: "Export completed successfully",
        data: {
          downloadUrl,
          fileName,
          totalRecords: 0, // We don't get this from the response
        },
      };
    } catch (error: unknown) {
      console.error("Export error:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  /**
   * Export CU registration correction requests to Excel
   * @returns Promise with export response
   */
  static async exportCuRegistrationCorrections(): Promise<ExportResponse> {
    try {
      // Backend mounts this router at /api/admissions/cu-registration-correction-requests
      // and the route path is GET /export
      const response = await axiosInstance.get(`/api/admissions/cu-registration-correction-requests/export`, {
        responseType: "blob", // Important for file downloads
      });

      // Extract filename from response headers
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `cu_registration_corrections_${new Date().toISOString().split("T")[0]}.xlsx`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      // Create download URL
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = URL.createObjectURL(blob);

      return {
        success: true,
        message: "Export completed successfully",
        data: {
          downloadUrl,
          fileName,
          totalRecords: 0, // We don't get this from the response
        },
      };
    } catch (error: unknown) {
      console.error("CU Registration export error:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  /**
   * Download CU registration documents as ZIP files
   * @param year - Academic year (e.g., 2025)
   * @param regulationType - Regulation type (e.g., 'CCF', 'CBCS')
   * @param downloadType - Type of download: 'combined', 'pdfs', or 'documents'
   * @param uploadSessionId - Socket session ID for progress tracking
   * @returns Promise with export response
   */
  static async downloadCuRegistrationDocuments(
    year: number,
    regulationType: string,
    downloadType: "combined" | "pdfs" | "documents" = "combined",
    uploadSessionId?: string,
  ): Promise<ExportResponse> {
    try {
      // Determine the correct endpoint based on download type
      let endpoint = "";
      switch (downloadType) {
        case "combined":
          endpoint = `/api/admissions/cu-registration-correction-requests/download/${year}/${regulationType}`;
          break;
        case "pdfs":
          endpoint = `/api/admissions/cu-registration-correction-requests/download-pdfs/${year}/${regulationType}`;
          break;
        case "documents":
          endpoint = `/api/admissions/cu-registration-correction-requests/download-documents/${year}/${regulationType}`;
          break;
      }

      // Add session ID as query parameter for socket progress tracking
      const url = uploadSessionId ? `${endpoint}?uploadSessionId=${uploadSessionId}` : endpoint;

      const response = await axiosInstance.get(url, {
        responseType: "blob", // Important for ZIP file downloads
      });

      // Extract filename from response headers
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `cu-registration-${downloadType}-${year}-${regulationType}.zip`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      // Create download URL
      const blob = new Blob([response.data], {
        type: "application/zip",
      });

      const downloadUrl = URL.createObjectURL(blob);

      return {
        success: true,
        message: "Download completed successfully",
        data: {
          downloadUrl,
          fileName,
          totalRecords: 0, // We don't get this from the response
        },
      };
    } catch (error: unknown) {
      console.error("CU Registration documents download error:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Download failed",
      };
    }
  }

  /**
   * Download file from URL
   * @param downloadUrl - The URL to download from
   * @param fileName - The filename for the download
   */
  static downloadFile(downloadUrl: string, fileName: string): void {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);
  }
}
