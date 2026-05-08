import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryStatusRow = {
  id: number;
  legacyStatusId: number | null;
  name: string;
  isIssuable: boolean;
  issuedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryStatusesListPayload = {
  rows: LibraryStatusRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryStatusUpsertBody = {
  name: string;
  isIssuable?: boolean;
  issuedTo?: string | null;
};

export type LibraryStatusesListQueryParams = {
  page: number;
  limit: number;
  search?: string;
};

const BASE = "/api/library/statuses";

export async function getLibraryStatuses(
  params: LibraryStatusesListQueryParams,
): Promise<ApiResponse<LibraryStatusesListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryStatusesListPayload>>(BASE, { params });
  return res.data;
}

export async function getLibraryStatusById(id: number): Promise<ApiResponse<LibraryStatusRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryStatusRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryStatus(
  body: LibraryStatusUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryStatus(
  id: number,
  body: LibraryStatusUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryStatus(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
