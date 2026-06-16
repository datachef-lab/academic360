import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryItemCategoryRow = {
  id: number;
  legacyItemCategoryId: number | null;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryItemCategoriesListPayload = {
  rows: LibraryItemCategoryRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryItemCategoryUpsertBody = {
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
};

const BASE = "/api/library/item-categories";

export async function getLibraryItemCategories(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<ApiResponse<LibraryItemCategoriesListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryItemCategoriesListPayload>>(BASE, {
    params,
  });
  return res.data;
}

export async function getLibraryItemCategoryById(
  id: number,
): Promise<ApiResponse<LibraryItemCategoryRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryItemCategoryRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryItemCategory(
  body: LibraryItemCategoryUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryItemCategory(
  id: number,
  body: LibraryItemCategoryUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryItemCategory(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
