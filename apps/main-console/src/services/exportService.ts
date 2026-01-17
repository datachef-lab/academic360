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

export interface ExcelUploadResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
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

  static async downloadStudentImages(academicYearId: number): Promise<ExportResponse> {
    try {
      const response = await axiosInstance.get(`/api/students/export/images`, {
        params: { academicYearId },
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let fileName = `student_images_${academicYearId}.zip`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      const blob = new Blob([response.data], {
        type: "application/zip",
      });

      const downloadUrl = URL.createObjectURL(blob);

      return {
        success: true,
        message: "Export completed successfully",
        data: {
          downloadUrl,
          fileName,
          totalRecords: 0,
        },
      };
    } catch (error: unknown) {
      console.error("Student images export error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  static async exportStudentSubjectsInventory(academicYearId: number): Promise<ExportResponse> {
    try {
      const response = await axiosInstance.get(`/api/subject-selection/student-subject-selection/exports/subjects`, {
        params: { academicYearId },
        responseType: "blob",
        timeout: 0,
      });

      const contentDisposition = response.headers["content-disposition"];
      let fileName = `student_subjects_${academicYearId}_${new Date().toISOString().split("T")[0]}.xlsx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

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
          totalRecords: 0,
        },
      };
    } catch (error: unknown) {
      console.error("Student subjects export error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  /**
   * Upload Excel to update CU Roll Number + CU Registration Number for students (matched by UID)
   * Backend: POST /api/students/update-cu-roll-reg (multipart/form-data, field: file)
   */
  static async updateStudentCuRollAndRegistration(file: File): Promise<ExcelUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post(`/api/students/update-cu-roll-reg`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return {
        success: true,
        message: "CU Roll/Registration update started",
        data: response.data,
      };
    } catch (error: unknown) {
      console.error("CU roll/reg update upload error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Upload Excel to import/add students (legacy importer)
   * Backend: POST /api/students/import-legacy-students (multipart/form-data, field: file)
   */
  static async importStudentsFromExcel(file: File): Promise<ExcelUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post(`/api/students/import-legacy-students`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return {
        success: true,
        message: "Student import completed",
        data: response.data,
      };
    } catch (error: unknown) {
      console.error("Student import upload error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Check if any of the provided UIDs already exist in the backend
   * Backend: POST /api/students/uids/check-existing
   */
  static async checkExistingStudentUids(uids: string[]): Promise<ExcelUploadResponse<{ existingUids: string[] }>> {
    try {
      const response = await axiosInstance.post(`/api/students/uids/check-existing`, {
        uids,
      });

      return {
        success: true,
        message: "UID check completed",
        // Backend ApiResponse uses `payload`; keep fallback to `data` for safety.
        data: (response.data?.payload ?? response.data?.data) as {
          existingUids: string[];
        },
      };
    } catch (error: unknown) {
      console.error("Check existing UIDs error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "UID check failed",
      };
    }
  }

  /**
   * Export CU registration correction requests to Excel
   * @param academicYearId - The academic year ID to filter by
   * @returns Promise with export response
   */
  static async exportCuRegistrationCorrections(academicYearId: number): Promise<ExportResponse> {
    try {
      // Backend mounts this router at /api/admissions/cu-registration-correction-requests
      // and the route path is GET /export
      const response = await axiosInstance.get(`/api/admissions/cu-registration-correction-requests/export`, {
        params: {
          academicYearId,
        },
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

  static async downloadExamAdmitCardsbyExamId(examId?: number, uploadSessionId?: string): Promise<ExportResponse> {
    try {
      const endpoint = `/api/exams/schedule/download-admit-cards?examId=${examId}`;

      // Add session ID as query parameter for socket progress tracking
      const url = uploadSessionId ? `${endpoint}&?uploadSessionId=${uploadSessionId}` : endpoint;

      const response = await axiosInstance.get(url, {
        responseType: "blob", // Important for ZIP file downloads
      });

      // Extract filename from response headers
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `exam-${examId}-admit-cards.zip`;

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

  static async downloadExamAttendanceSheetsbyExamId(
    examId?: number,
    uploadSessionId?: string,
  ): Promise<ExportResponse> {
    try {
      const endpoint = `/api/exams/schedule/download-attendance-sheets?examId=${examId}`;

      // Add session ID as query parameter for socket progress tracking
      const url = uploadSessionId ? `${endpoint}&?uploadSessionId=${uploadSessionId}` : endpoint;

      const response = await axiosInstance.get(url, {
        responseType: "blob", // Important for ZIP file downloads
      });

      // Extract filename from response headers
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `exam-${examId}-attendance-sheets.zip`;

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
      console.error("Attendance DR sheets download error:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Download failed",
      };
    }
  }

  /**
   * Export student detailed data report
   */
  static async exportStudentDetailedReport(academicYearId?: number): Promise<ExportResponse> {
    try {
      const params = new URLSearchParams();
      if (academicYearId) {
        params.append("academicYearId", academicYearId.toString());
      }
      const endpoint = `/api/students/export/detailed-report${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await axiosInstance.get(endpoint, {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let fileName = `student_data_export_${new Date().toISOString().split("T")[0]}.xlsx`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

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
          totalRecords: 0,
        },
      };
    } catch (error: unknown) {
      console.error("Student detailed export error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  /**
   * Export student academic subjects report
   */
  static async exportStudentAcademicSubjectsReport(academicYearId?: number): Promise<ExportResponse> {
    try {
      const params = new URLSearchParams();
      if (academicYearId) {
        params.append("academicYearId", academicYearId.toString());
      }
      const endpoint = `/api/students/export/academic-subjects${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await axiosInstance.get(endpoint, {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let fileName = `student_academic_subjects_${new Date().toISOString().split("T")[0]}.xlsx`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

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
          totalRecords: 0,
        },
      };
    } catch (error: unknown) {
      console.error("Student academic subjects export error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Export failed",
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
