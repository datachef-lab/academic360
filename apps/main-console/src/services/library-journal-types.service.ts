import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type JournalTypeRow = {
  id: number;
  legacyJournalTypeId: number | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type JournalTypesListPayload = {
  rows: JournalTypeRow[];
  total: number;
  page: number;
  limit: number;
};

export type JournalTypeUpsertBody = {
  name: string;
};

export type JournalTypeListQueryParams = {
  page: number;
  limit: number;
  search?: string;
};

const BASE = "/api/library/journal-types";

export async function getJournalTypes(
  params: JournalTypeListQueryParams,
): Promise<ApiResponse<JournalTypesListPayload>> {
  const res = await axiosInstance.get<ApiResponse<JournalTypesListPayload>>(BASE, { params });
  return res.data;
}

export async function getJournalTypeById(id: number): Promise<ApiResponse<JournalTypeRow>> {
  const res = await axiosInstance.get<ApiResponse<JournalTypeRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createJournalType(
  body: JournalTypeUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateJournalType(
  id: number,
  body: JournalTypeUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteJournalType(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
