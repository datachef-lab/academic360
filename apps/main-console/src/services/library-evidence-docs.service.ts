import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type EvidenceDocRow = {
  id: number;
  criterionCode: string;
  title: string;
  description: string | null;
  fileKey: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  tags: string | null;
  academicYear: string | null;
  uploadedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceDocPayload = {
  rows: EvidenceDocRow[];
  total: number;
  page: number;
  limit: number;
};

export type EvidenceDocUpsertBody = {
  criterionCode: string;
  title: string;
  description?: string | null;
  fileKey: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  tags?: string | null;
  academicYear?: string | null;
  uploadedByUserId?: number | null;
};

const BASE = "/api/library/evidence-docs";

export async function getEvidenceDocs(params: {
  page: number;
  limit: number;
  search?: string;
  criterionCode?: string;
  academicYear?: string;
}) {
  const res = await axiosInstance.get<ApiResponse<EvidenceDocPayload>>(BASE, {
    params,
  });
  return res.data;
}

export async function getEvidenceDocById(id: number) {
  const res = await axiosInstance.get<ApiResponse<EvidenceDocRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createEvidenceDoc(body: EvidenceDocUpsertBody) {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateEvidenceDoc(id: number, body: EvidenceDocUpsertBody) {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteEvidenceDoc(id: number) {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
