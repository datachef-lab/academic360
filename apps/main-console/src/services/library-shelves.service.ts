import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryShelfRow = {
  id: number;
  legacyShelfId: number | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryShelvesListPayload = {
  rows: LibraryShelfRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryShelfUpsertBody = {
  name: string;
};

export type LibraryShelvesListQueryParams = {
  page: number;
  limit: number;
  search?: string;
};

const BASE = "/api/library/shelves";

export async function getLibraryShelves(
  params: LibraryShelvesListQueryParams,
): Promise<ApiResponse<LibraryShelvesListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryShelvesListPayload>>(BASE, { params });
  return res.data;
}

export async function getLibraryShelfById(id: number): Promise<ApiResponse<LibraryShelfRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryShelfRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryShelf(
  body: LibraryShelfUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryShelf(
  id: number,
  body: LibraryShelfUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryShelf(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
