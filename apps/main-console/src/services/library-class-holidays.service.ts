import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryClassHolidayRow = {
  id: number;
  legacyHolidayStudentMappingId: number | null;
  holidayId: number;
  programCourseId: number;
  classId: number;
  isHoliday: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryClassHolidaysListPayload = {
  rows: LibraryClassHolidayRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryClassHolidayUpsertBody = {
  holidayId: number;
  programCourseId: number;
  classId: number;
  isHoliday?: boolean;
  legacyHolidayStudentMappingId?: number | null;
};

export type LibraryClassHolidaysListQueryParams = {
  page: number;
  limit: number;
};

const BASE = "/api/library/class-holidays";

export async function getLibraryClassHolidays(
  params: LibraryClassHolidaysListQueryParams,
): Promise<ApiResponse<LibraryClassHolidaysListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryClassHolidaysListPayload>>(BASE, {
    params,
  });
  return res.data;
}

export async function getLibraryClassHolidayById(
  id: number,
): Promise<ApiResponse<LibraryClassHolidayRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryClassHolidayRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryClassHoliday(
  body: LibraryClassHolidayUpsertBody,
): Promise<ApiResponse<LibraryClassHolidayRow>> {
  const res = await axiosInstance.post<ApiResponse<LibraryClassHolidayRow>>(BASE, body);
  return res.data;
}

export async function updateLibraryClassHoliday(
  id: number,
  body: Partial<LibraryClassHolidayUpsertBody>,
): Promise<ApiResponse<LibraryClassHolidayRow>> {
  const res = await axiosInstance.put<ApiResponse<LibraryClassHolidayRow>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryClassHoliday(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
