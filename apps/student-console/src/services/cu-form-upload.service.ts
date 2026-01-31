import { axiosInstance as api } from "@/lib/utils";
import type { ApiResponse } from "@/types/api-response";

export interface CuFormUploadResponse {
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

const BASE = "/api/cu-form-upload";

/**
 * Upload CU Semester I Examination Form to S3
 */
export async function uploadCuForm(file: File): Promise<CuFormUploadResponse> {
  console.info(`[CU-FORM-UPLOAD] Starting upload:`, {
    fileName: file.name,
    fileSize: file.size,
    fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
    fileType: file.type,
  });

  // Validate file before upload
  if (!file) {
    throw new Error("No file selected");
  }

  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed");
  }

  if (file.size > 2 * 1024 * 1024) {
    // 2MB limit
    throw new Error("File size must be less than 2MB");
  }

  const form = new FormData();
  form.append("file", file);

  try {
    const res = await api.post<ApiResponse<CuFormUploadResponse>>(BASE, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.info(`[CU-FORM-UPLOAD] Upload successful:`, res.data);
    return res.data.payload as CuFormUploadResponse;
  } catch (error: any) {
    console.error(`[CU-FORM-UPLOAD] Upload failed:`, error.response?.data || error.message);

    // Extract error message from API response if available
    const errorMessage =
      error.response?.data?.payload?.error || error.response?.data?.message || error.message || "Upload failed";

    throw new Error(errorMessage);
  }
}
