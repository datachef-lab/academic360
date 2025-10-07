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
    } catch (error: any) {
      console.error("Export error:", error);

      return {
        success: false,
        message: error.response?.data?.message || "Export failed",
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
