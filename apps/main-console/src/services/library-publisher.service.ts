import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryPublisher = {
  id: number;
  legacyPublisherId: number | null;
  name: string;
  code: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryPublisherListPayload = {
  rows: LibraryPublisher[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryPublisherListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type UpsertLibraryPublisherInput = {
  name: string;
  code?: string | null;
};

const BASE_URL = "/api/library/publishers";

export async function getLibraryPublishers(
  filters: LibraryPublisherListFilters,
): Promise<ApiResponse<LibraryPublisherListPayload>> {
  const response = await axiosInstance.get<ApiResponse<LibraryPublisherListPayload>>(BASE_URL, {
    params: filters,
  });
  return response.data;
}

export async function createLibraryPublisher(
  payload: UpsertLibraryPublisherInput,
): Promise<ApiResponse<LibraryPublisher>> {
  const response = await axiosInstance.post<ApiResponse<LibraryPublisher>>(BASE_URL, payload);
  return response.data;
}

export async function updateLibraryPublisher(
  id: number,
  payload: UpsertLibraryPublisherInput,
): Promise<ApiResponse<LibraryPublisher>> {
  const response = await axiosInstance.put<ApiResponse<LibraryPublisher>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteLibraryPublisher(id: number): Promise<ApiResponse<LibraryPublisher>> {
  const response = await axiosInstance.delete<ApiResponse<LibraryPublisher>>(`${BASE_URL}/${id}`);
  return response.data;
}
