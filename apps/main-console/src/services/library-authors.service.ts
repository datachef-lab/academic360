import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryAuthorRow = {
  id: number;
  legacyAuthorId: number | null;
  name: string;
  shortName: string | null;
  nationalityId: number | null;
  authorTypeId: number | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryAuthorsListPayload = {
  rows: LibraryAuthorRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryAuthorUpsertBody = {
  name: string;
  shortName?: string | null;
  nationalityId?: number | null;
  authorTypeId?: number | null;
  remarks?: string | null;
  legacyAuthorId?: number | null;
};

export type LibraryAuthorsListQueryParams = {
  page: number;
  limit: number;
  search?: string;
};

const BASE = "/api/library/authors";

export async function getLibraryAuthors(
  params: LibraryAuthorsListQueryParams,
): Promise<ApiResponse<LibraryAuthorsListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryAuthorsListPayload>>(BASE, { params });
  return res.data;
}

export async function getLibraryAuthorById(id: number): Promise<ApiResponse<LibraryAuthorRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryAuthorRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryAuthor(
  body: LibraryAuthorUpsertBody,
): Promise<ApiResponse<LibraryAuthorRow>> {
  const res = await axiosInstance.post<ApiResponse<LibraryAuthorRow>>(BASE, body);
  return res.data;
}

export async function updateLibraryAuthor(
  id: number,
  body: Partial<LibraryAuthorUpsertBody>,
): Promise<ApiResponse<LibraryAuthorRow>> {
  const res = await axiosInstance.put<ApiResponse<LibraryAuthorRow>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryAuthor(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
