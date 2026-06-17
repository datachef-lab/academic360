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
  fileKey?: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  tags?: string | null;
  academicYear?: string | null;
  uploadedByUserId?: number | null;
};

function bodyToFormData(body: EvidenceDocUpsertBody, file?: File | null): FormData {
  const fd = new FormData();
  if (file) fd.append("file", file);
  for (const [k, v] of Object.entries(body)) {
    if (v == null) continue;
    fd.append(k, String(v));
  }
  return fd;
}

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

export async function createEvidenceDoc(body: EvidenceDocUpsertBody, file?: File | null) {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(
    BASE,
    bodyToFormData(body, file),
  );
  return res.data;
}

export async function updateEvidenceDoc(
  id: number,
  body: EvidenceDocUpsertBody,
  file?: File | null,
) {
  const res = await axiosInstance.put<ApiResponse<null>>(
    `${BASE}/${id}`,
    bodyToFormData(body, file),
  );
  return res.data;
}

export async function deleteEvidenceDoc(id: number) {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}

export async function getEvidenceDocUrl(id: number) {
  const res = await axiosInstance.get<ApiResponse<{ url: string }>>(`${BASE}/${id}/url`);
  return res.data;
}
