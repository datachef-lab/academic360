import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryCirculationPolicyRow = {
  id: number;
  patronCategoryId: number;
  patronCategoryName: string;
  itemCategoryId: number;
  itemCategoryName: string;
  loanDays: number;
  finePerDay: number;
  renewalLimit: number;
  graceDays: number;
  maxCopiesAtOnce: number;
  skipHolidaysInFine: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryCirculationPoliciesListPayload = {
  rows: LibraryCirculationPolicyRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryCirculationPolicyUpsertBody = {
  patronCategoryId: number;
  itemCategoryId: number;
  loanDays: number;
  finePerDay: number;
  renewalLimit: number;
  graceDays: number;
  maxCopiesAtOnce: number;
  skipHolidaysInFine: boolean;
  isActive?: boolean;
};

const BASE = "/api/library/circulation-policies";

export async function getLibraryCirculationPolicies(params: {
  page: number;
  limit: number;
  patronCategoryId?: number;
  itemCategoryId?: number;
}): Promise<ApiResponse<LibraryCirculationPoliciesListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryCirculationPoliciesListPayload>>(BASE, {
    params,
  });
  return res.data;
}

export async function getLibraryCirculationPolicyById(
  id: number,
): Promise<ApiResponse<LibraryCirculationPolicyRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryCirculationPolicyRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryCirculationPolicy(
  body: LibraryCirculationPolicyUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryCirculationPolicy(
  id: number,
  body: LibraryCirculationPolicyUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryCirculationPolicy(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
