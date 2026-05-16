import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibrarySeries = {
  id: number;
  legacySeriesId: number | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type LibrarySeriesListPayload = {
  rows: LibrarySeries[];
  total: number;
  page: number;
  limit: number;
};

export type LibrarySeriesListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type UpsertLibrarySeriesInput = {
  name: string;
};

const BASE_URL = "/api/library/series";

export async function getLibrarySeries(
  filters: LibrarySeriesListFilters,
): Promise<ApiResponse<LibrarySeriesListPayload>> {
  const response = await axiosInstance.get<ApiResponse<LibrarySeriesListPayload>>(BASE_URL, {
    params: filters,
  });
  return response.data;
}

export async function createLibrarySeries(
  payload: UpsertLibrarySeriesInput,
): Promise<ApiResponse<LibrarySeries>> {
  const response = await axiosInstance.post<ApiResponse<LibrarySeries>>(BASE_URL, payload);
  return response.data;
}

export async function updateLibrarySeries(
  id: number,
  payload: UpsertLibrarySeriesInput,
): Promise<ApiResponse<LibrarySeries>> {
  const response = await axiosInstance.put<ApiResponse<LibrarySeries>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteLibrarySeries(id: number): Promise<ApiResponse<LibrarySeries>> {
  const response = await axiosInstance.delete<ApiResponse<LibrarySeries>>(`${BASE_URL}/${id}`);
  return response.data;
}
