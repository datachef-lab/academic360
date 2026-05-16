import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryEntryMode = {
  id: number;
  legacyEntryModeId: number | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryEntryModeListPayload = {
  rows: LibraryEntryMode[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryEntryModeListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type UpsertLibraryEntryModeInput = {
  name: string;
};

const BASE_URL = "/api/library/entry-modes";

export async function getLibraryEntryModes(
  filters: LibraryEntryModeListFilters,
): Promise<ApiResponse<LibraryEntryModeListPayload>> {
  const response = await axiosInstance.get<ApiResponse<LibraryEntryModeListPayload>>(BASE_URL, {
    params: filters,
  });
  return response.data;
}

export async function createLibraryEntryMode(
  payload: UpsertLibraryEntryModeInput,
): Promise<ApiResponse<LibraryEntryMode>> {
  const response = await axiosInstance.post<ApiResponse<LibraryEntryMode>>(BASE_URL, payload);
  return response.data;
}

export async function updateLibraryEntryMode(
  id: number,
  payload: UpsertLibraryEntryModeInput,
): Promise<ApiResponse<LibraryEntryMode>> {
  const response = await axiosInstance.put<ApiResponse<LibraryEntryMode>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteLibraryEntryMode(id: number): Promise<ApiResponse<LibraryEntryMode>> {
  const response = await axiosInstance.delete<ApiResponse<LibraryEntryMode>>(`${BASE_URL}/${id}`);
  return response.data;
}
