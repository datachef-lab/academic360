import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryAuthorTypeRow = {
  id: number;
  legacyAuthorTypeId: number | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryAuthorTypesListPayload = {
  rows: LibraryAuthorTypeRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryAuthorTypeUpsertBody = {
  name: string;
};

export type LibraryAuthorTypesListQueryParams = {
  page: number;
  limit: number;
  search?: string;
};

const BASE = "/api/library/author-types";

export async function getLibraryAuthorTypes(
  params: LibraryAuthorTypesListQueryParams,
): Promise<ApiResponse<LibraryAuthorTypesListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryAuthorTypesListPayload>>(BASE, { params });
  return res.data;
}

export async function getLibraryAuthorTypeById(
  id: number,
): Promise<ApiResponse<LibraryAuthorTypeRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryAuthorTypeRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryAuthorType(
  body: LibraryAuthorTypeUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryAuthorType(
  id: number,
  body: LibraryAuthorTypeUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryAuthorType(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
