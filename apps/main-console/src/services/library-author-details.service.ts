import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryAuthorDetailRow = {
  id: number;
  legacyAuthorDetailsId: number | null;
  bookId: number;
  authorTypeId: number;
  authorId: number;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryAuthorDetailsListPayload = {
  rows: LibraryAuthorDetailRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryAuthorDetailUpsertBody = {
  bookId: number;
  authorTypeId: number;
  authorId: number;
  remarks?: string | null;
  legacyAuthorDetailsId?: number | null;
};

export type LibraryAuthorDetailsListQueryParams = {
  page: number;
  limit: number;
};

const BASE = "/api/library/author-details";

export async function getLibraryAuthorDetails(
  params: LibraryAuthorDetailsListQueryParams,
): Promise<ApiResponse<LibraryAuthorDetailsListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryAuthorDetailsListPayload>>(BASE, {
    params,
  });
  return res.data;
}

export async function getLibraryAuthorDetailById(
  id: number,
): Promise<ApiResponse<LibraryAuthorDetailRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryAuthorDetailRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryAuthorDetail(
  body: LibraryAuthorDetailUpsertBody,
): Promise<ApiResponse<LibraryAuthorDetailRow>> {
  const res = await axiosInstance.post<ApiResponse<LibraryAuthorDetailRow>>(BASE, body);
  return res.data;
}

export async function updateLibraryAuthorDetail(
  id: number,
  body: Partial<LibraryAuthorDetailUpsertBody>,
): Promise<ApiResponse<LibraryAuthorDetailRow>> {
  const res = await axiosInstance.put<ApiResponse<LibraryAuthorDetailRow>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryAuthorDetail(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
