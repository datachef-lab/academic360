import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import { Stream } from "@repo/db";

export interface BulkUploadResult {
  success: Stream[];
  errors: Array<{
    row: number;
    data: unknown;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

const BASE = "/api/course-design/streams";

// Get all streams
export async function getAllStreams(): Promise<Stream[]> {
  const response = await axiosInstance.get<ApiResonse<Stream[]>>(BASE);
  return response.data.payload;
}

// Get stream by ID
export const getStreamById = async (id: number): Promise<Stream> => {
  const res = await axiosInstance.get<ApiResonse<Stream>>(`${BASE}/${id}`);
  return res.data.payload;
};

// Create stream
export const createStream = async (data: Record<string, unknown>): Promise<Stream> => {
  const res = await axiosInstance.post<ApiResonse<Stream>>(BASE, data);
  return res.data.payload;
};

// Update stream
export const updateStream = async (id: number, data: Record<string, unknown>): Promise<Stream> => {
  const res = await axiosInstance.put<ApiResonse<Stream>>(`${BASE}/${id}`, data);
  return res.data.payload;
};

// Delete stream
export const deleteStream = async (
  id: number,
): Promise<{ success: boolean; message?: string; records?: Array<{ type: string; count: number }> }> => {
  const res = await axiosInstance.delete<
    ApiResonse<{ success: boolean; message?: string; records?: Array<{ type: string; count: number }> }>
  >(`${BASE}/${id}`);
  return res.data.payload;
};

// Bulk upload streams
export const bulkUploadStreams = async (file: File): Promise<BulkUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post<ApiResonse<BulkUploadResult>>(`${BASE}/bulk-upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data.payload;
};
