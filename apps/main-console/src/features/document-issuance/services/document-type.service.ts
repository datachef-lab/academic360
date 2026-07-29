import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

const BASE_URL = "/api/documents";

export type DocumentType = {
  id: number;
  name: string;
  description: string | null;
  sequence: number | null;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentTypePayload = {
  name: string;
  description?: string | null;
  sequence?: number | null;
  isActive?: boolean;
};

export async function getAllDocumentTypes() {
  const { data } = await axiosInstance.get<ApiResponse<DocumentType[]>>(BASE_URL);
  return Array.isArray(data.payload) ? data.payload : [];
}

export async function createDocumentType(payload: DocumentTypePayload) {
  const { data } = await axiosInstance.post<ApiResponse<DocumentType | null>>(BASE_URL, payload);
  return data.payload;
}

export async function updateDocumentType(id: number, payload: Partial<DocumentTypePayload>) {
  const { data } = await axiosInstance.put<ApiResponse<DocumentType | null>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return data.payload;
}

export async function deleteDocumentType(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<DocumentType | null>>(
    `${BASE_URL}/${id}`,
  );
  return data;
}
