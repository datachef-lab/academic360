import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryZoneRow = {
  id: number;
  branchId: number | null;
  branchName: string | null;
  name: string;
  code: string | null;
  description: string | null;
  capacity: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryZoneListPayload = {
  rows: LibraryZoneRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryZoneUpsertBody = {
  branchId?: number | null;
  name: string;
  code?: string | null;
  description?: string | null;
  capacity?: number | null;
  isActive?: boolean;
};

const BASE = "/api/library/zones";

export async function getLibraryZones(params: {
  page: number;
  limit: number;
  search?: string;
  branchId?: number;
  isActive?: boolean;
}) {
  const res = await axiosInstance.get<ApiResponse<LibraryZoneListPayload>>(BASE, { params });
  return res.data;
}

export async function getLibraryZoneById(id: number) {
  const res = await axiosInstance.get<ApiResponse<LibraryZoneRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryZone(body: LibraryZoneUpsertBody) {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryZone(id: number, body: LibraryZoneUpsertBody) {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryZone(id: number) {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
