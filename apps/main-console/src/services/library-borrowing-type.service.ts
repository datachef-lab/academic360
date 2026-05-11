import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryBorrowingType = {
  id: number;
  legacyBorrowingTypeId: number | null;
  name: string;
  searchGuideline: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryBorrowingTypeListPayload = {
  rows: LibraryBorrowingType[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryBorrowingTypeListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type UpsertLibraryBorrowingTypeInput = {
  name: string;
  searchGuideline?: boolean;
};

const BASE_URL = "/api/library/borrowing-types";

export async function getLibraryBorrowingTypes(
  filters: LibraryBorrowingTypeListFilters,
): Promise<ApiResponse<LibraryBorrowingTypeListPayload>> {
  const response = await axiosInstance.get<ApiResponse<LibraryBorrowingTypeListPayload>>(BASE_URL, {
    params: filters,
  });
  return response.data;
}

export async function createLibraryBorrowingType(
  payload: UpsertLibraryBorrowingTypeInput,
): Promise<ApiResponse<LibraryBorrowingType>> {
  const response = await axiosInstance.post<ApiResponse<LibraryBorrowingType>>(BASE_URL, payload);
  return response.data;
}

export async function updateLibraryBorrowingType(
  id: number,
  payload: UpsertLibraryBorrowingTypeInput,
): Promise<ApiResponse<LibraryBorrowingType>> {
  const response = await axiosInstance.put<ApiResponse<LibraryBorrowingType>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteLibraryBorrowingType(
  id: number,
): Promise<ApiResponse<LibraryBorrowingType>> {
  const response = await axiosInstance.delete<ApiResponse<LibraryBorrowingType>>(
    `${BASE_URL}/${id}`,
  );
  return response.data;
}
