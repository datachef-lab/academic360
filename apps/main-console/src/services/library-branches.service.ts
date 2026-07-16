import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryBranchRow = {
  id: number;
  legacyBranchId: number | null;
  name: string;
  code: string | null;
  openingDate: string | null;
  isActive: boolean;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryBranchesListPayload = {
  rows: LibraryBranchRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryBranchUpsertBody = {
  name: string;
  code?: string | null;
  openingDate?: string | null;
  isActive?: boolean;
  remarks?: string | null;
};

export type LibraryBranchesListQueryParams = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
};

const BASE = "/api/library/branches";

export async function getLibraryBranches(
  params: LibraryBranchesListQueryParams,
): Promise<ApiResponse<LibraryBranchesListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryBranchesListPayload>>(BASE, { params });
  return res.data;
}

export async function getLibraryBranchById(id: number): Promise<ApiResponse<LibraryBranchRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryBranchRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryBranch(
  body: LibraryBranchUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryBranch(
  id: number,
  body: LibraryBranchUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryBranch(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
