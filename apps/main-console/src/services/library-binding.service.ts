import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryBinding = {
  id: number;
  legacyBindingId: number | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryBindingListPayload = {
  rows: LibraryBinding[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryBindingListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type UpsertLibraryBindingInput = {
  name: string;
  legacyBindingId?: number | null;
};

const BASE_URL = "/api/library/bindings";

export async function getLibraryBindings(
  filters: LibraryBindingListFilters,
): Promise<ApiResponse<LibraryBindingListPayload>> {
  const response = await axiosInstance.get<ApiResponse<LibraryBindingListPayload>>(BASE_URL, {
    params: filters,
  });
  return response.data;
}

export async function createLibraryBinding(
  payload: UpsertLibraryBindingInput,
): Promise<ApiResponse<LibraryBinding>> {
  const response = await axiosInstance.post<ApiResponse<LibraryBinding>>(BASE_URL, payload);
  return response.data;
}

export async function updateLibraryBinding(
  id: number,
  payload: UpsertLibraryBindingInput,
): Promise<ApiResponse<LibraryBinding>> {
  const response = await axiosInstance.put<ApiResponse<LibraryBinding>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteLibraryBinding(id: number): Promise<ApiResponse<LibraryBinding>> {
  const response = await axiosInstance.delete<ApiResponse<LibraryBinding>>(`${BASE_URL}/${id}`);
  return response.data;
}
