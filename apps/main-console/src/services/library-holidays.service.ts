import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryHolidayRow = {
  id: number;
  legacyHolidayId: number | null;
  name: string;
  shortName: string | null;
  from: string;
  to: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryHolidaysListPayload = {
  rows: LibraryHolidayRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryHolidayUpsertBody = {
  name: string;
  shortName?: string | null;
  from: string;
  to: string;
  remarks?: string | null;
};

export type LibraryHolidaysListQueryParams = {
  page: number;
  limit: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
};

const BASE = "/api/library/holidays";

export async function getLibraryHolidays(
  params: LibraryHolidaysListQueryParams,
): Promise<ApiResponse<LibraryHolidaysListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryHolidaysListPayload>>(BASE, { params });
  return res.data;
}

export async function getLibraryHolidayById(id: number): Promise<ApiResponse<LibraryHolidayRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryHolidayRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryHoliday(
  body: LibraryHolidayUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryHoliday(
  id: number,
  body: LibraryHolidayUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryHoliday(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
