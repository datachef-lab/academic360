import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryRackRow = {
  id: number;
  legacyRackId: number | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryRacksListPayload = {
  rows: LibraryRackRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryRackUpsertBody = {
  name: string;
};

export type LibraryRacksListQueryParams = {
  page: number;
  limit: number;
  search?: string;
};

const BASE = "/api/library/racks";

export async function getLibraryRacks(
  params: LibraryRacksListQueryParams,
): Promise<ApiResponse<LibraryRacksListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryRacksListPayload>>(BASE, { params });
  return res.data;
}

export async function getLibraryRackById(id: number): Promise<ApiResponse<LibraryRackRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryRackRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryRack(
  body: LibraryRackUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryRack(
  id: number,
  body: LibraryRackUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryRack(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
