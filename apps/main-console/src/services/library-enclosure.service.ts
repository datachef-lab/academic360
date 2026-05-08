import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryEnclosure = {
  id: number;
  legacyEnclosureId: number | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryEnclosureListPayload = {
  rows: LibraryEnclosure[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryEnclosureListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type UpsertLibraryEnclosureInput = {
  name: string;
};

const BASE_URL = "/api/library/enclosures";

export async function getLibraryEnclosures(
  filters: LibraryEnclosureListFilters,
): Promise<ApiResponse<LibraryEnclosureListPayload>> {
  const response = await axiosInstance.get<ApiResponse<LibraryEnclosureListPayload>>(BASE_URL, {
    params: filters,
  });
  return response.data;
}

export async function createLibraryEnclosure(
  payload: UpsertLibraryEnclosureInput,
): Promise<ApiResponse<LibraryEnclosure>> {
  const response = await axiosInstance.post<ApiResponse<LibraryEnclosure>>(BASE_URL, payload);
  return response.data;
}

export async function updateLibraryEnclosure(
  id: number,
  payload: UpsertLibraryEnclosureInput,
): Promise<ApiResponse<LibraryEnclosure>> {
  const response = await axiosInstance.put<ApiResponse<LibraryEnclosure>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteLibraryEnclosure(id: number): Promise<ApiResponse<LibraryEnclosure>> {
  const response = await axiosInstance.delete<ApiResponse<LibraryEnclosure>>(`${BASE_URL}/${id}`);
  return response.data;
}
