import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type AcademicArchiveRow = {
  id: number;
  archiveType: string;
  title: string;
  description: string | null;
  programCourseId: number | null;
  programCourseName: string | null;
  classId: number | null;
  className: string | null;
  year: number | null;
  fileKey: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  tags: string | null;
  uploadedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AcademicArchivePayload = {
  rows: AcademicArchiveRow[];
  total: number;
  page: number;
  limit: number;
};

export type AcademicArchiveUpsertBody = {
  archiveType: string;
  title: string;
  description?: string | null;
  programCourseId?: number | null;
  classId?: number | null;
  year?: number | null;
  fileKey: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  tags?: string | null;
  uploadedByUserId?: number | null;
};

const BASE = "/api/library/academic-archives";

export async function getAcademicArchives(params: {
  page: number;
  limit: number;
  search?: string;
  archiveType?: string;
  programCourseId?: number;
  classId?: number;
  year?: number;
}) {
  const res = await axiosInstance.get<ApiResponse<AcademicArchivePayload>>(BASE, { params });
  return res.data;
}

export async function getAcademicArchiveById(id: number) {
  const res = await axiosInstance.get<ApiResponse<AcademicArchiveRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createAcademicArchive(body: AcademicArchiveUpsertBody) {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateAcademicArchive(id: number, body: AcademicArchiveUpsertBody) {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteAcademicArchive(id: number) {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
