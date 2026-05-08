import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryDocumentTypeRow = {
  id: number;
  legacyLibraryDocumentTypeId: number | null;
  name: string;
  libraryArticleId: number | null;
  libraryArticleName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryDocumentTypesListPayload = {
  rows: LibraryDocumentTypeRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryDocumentTypeUpsertBody = {
  name: string;
  libraryArticleId?: number | null;
};

export type LibraryDocumentTypeListQueryParams = {
  page: number;
  limit: number;
  search?: string;
  libraryArticleId?: number;
};

const BASE = "/api/library/document-types";

export async function getLibraryDocumentTypes(
  params: LibraryDocumentTypeListQueryParams,
): Promise<ApiResponse<LibraryDocumentTypesListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryDocumentTypesListPayload>>(BASE, {
    params,
  });
  return res.data;
}

export async function getLibraryDocumentTypeById(
  id: number,
): Promise<ApiResponse<LibraryDocumentTypeRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryDocumentTypeRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryDocumentType(
  body: LibraryDocumentTypeUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryDocumentType(
  id: number,
  body: LibraryDocumentTypeUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryDocumentType(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
