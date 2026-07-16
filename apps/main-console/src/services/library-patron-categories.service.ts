import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryPatronCategoryRow = {
  id: number;
  legacyPatronCategoryId: number | null;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryPatronCategoriesListPayload = {
  rows: LibraryPatronCategoryRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryPatronCategoryUpsertBody = {
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
};

const BASE = "/api/library/patron-categories";

export async function getLibraryPatronCategories(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<ApiResponse<LibraryPatronCategoriesListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryPatronCategoriesListPayload>>(BASE, {
    params,
  });
  return res.data;
}

export async function getLibraryPatronCategoryById(
  id: number,
): Promise<ApiResponse<LibraryPatronCategoryRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryPatronCategoryRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryPatronCategory(
  body: LibraryPatronCategoryUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryPatronCategory(
  id: number,
  body: LibraryPatronCategoryUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryPatronCategory(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
