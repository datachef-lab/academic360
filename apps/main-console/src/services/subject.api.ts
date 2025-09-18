import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import { Subject } from "@/types/course-design";

export interface BulkUploadResult {
  success: Subject[];
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

const BASE = "/api/course-design/subjects";

// Get all subjects
export async function getAllSubjects(): Promise<Subject[]> {
  const response = await axiosInstance.get<ApiResponse<Subject[]>>(BASE);
  return response.data.payload;
}

// Get subject by ID
export const getSubjectById = async (id: number): Promise<Subject> => {
  const res = await axiosInstance.get<Subject>(`${BASE}/${id}`);
  return res.data;
};

// Create subject
export const createSubject = async (data: Omit<Subject, "id" | "createdAt" | "updatedAt">): Promise<Subject> => {
  const res = await axiosInstance.post<Subject>(BASE, data);
  return res.data;
};

// Update subject
export const updateSubject = async (
  id: number,
  data: Partial<Omit<Subject, "id" | "createdAt" | "updatedAt">>,
): Promise<Subject> => {
  const res = await axiosInstance.put<Subject>(`${BASE}/${id}`, data);
  return res.data;
};

// Delete subject
export const deleteSubject = async (id: number): Promise<{ success: boolean }> => {
  const res = await axiosInstance.delete<{ success: boolean }>(`${BASE}/${id}`);
  return res.data;
};

// Bulk upload subjects
export const bulkUploadSubjects = async (file: File): Promise<BulkUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post<ApiResponse<BulkUploadResult>>(`${BASE}/bulk-upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data.payload;
};
