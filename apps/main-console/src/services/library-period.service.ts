import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryPeriod = {
  id: number;
  legacyLibraryPeriodId: number | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryPeriodListPayload = {
  rows: LibraryPeriod[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryPeriodListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type UpsertLibraryPeriodInput = {
  name: string;
};

const BASE_URL = "/api/library/periods";

export async function getLibraryPeriods(
  filters: LibraryPeriodListFilters,
): Promise<ApiResponse<LibraryPeriodListPayload>> {
  const response = await axiosInstance.get<ApiResponse<LibraryPeriodListPayload>>(BASE_URL, {
    params: filters,
  });
  return response.data;
}

export async function createLibraryPeriod(
  payload: UpsertLibraryPeriodInput,
): Promise<ApiResponse<LibraryPeriod>> {
  const response = await axiosInstance.post<ApiResponse<LibraryPeriod>>(BASE_URL, payload);
  return response.data;
}

export async function updateLibraryPeriod(
  id: number,
  payload: UpsertLibraryPeriodInput,
): Promise<ApiResponse<LibraryPeriod>> {
  const response = await axiosInstance.put<ApiResponse<LibraryPeriod>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteLibraryPeriod(id: number): Promise<ApiResponse<LibraryPeriod>> {
  const response = await axiosInstance.delete<ApiResponse<LibraryPeriod>>(`${BASE_URL}/${id}`);
  return response.data;
}
