import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryVendorRow = {
  id: number;
  legacyVendorId: number | null;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  personOfContact: string | null;
  personOfContactEmail: string | null;
  personOfContactPhone: string | null;
  pan: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryVendorsListPayload = {
  rows: LibraryVendorRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryVendorUpsertBody = {
  name: string;
  code?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  personOfContact?: string | null;
  personOfContactEmail?: string | null;
  personOfContactPhone?: string | null;
  pan?: string | null;
};

export type LibraryVendorsListQueryParams = {
  page: number;
  limit: number;
  search?: string;
};

const BASE = "/api/library/vendors";

export async function getLibraryVendors(
  params: LibraryVendorsListQueryParams,
): Promise<ApiResponse<LibraryVendorsListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryVendorsListPayload>>(BASE, { params });
  return res.data;
}

export async function getLibraryVendorById(id: number): Promise<ApiResponse<LibraryVendorRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryVendorRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryVendor(
  body: LibraryVendorUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryVendor(
  id: number,
  body: LibraryVendorUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryVendor(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
