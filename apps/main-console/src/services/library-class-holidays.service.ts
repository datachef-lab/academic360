import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryClassHolidayRow = {
  id: number;
  legacyHolidayStudentMappingId: number | null;
  holidayId: number;
  holidayName: string;
  holidayFrom: string;
  holidayTo: string;
  programCourseId: number;
  programCourseName: string | null;
  classId: number;
  className: string;
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
  isHoliday: boolean;
};

export type LibraryClassHolidaysListQueryParams = {
  page: number;
  limit: number;
  holidayId?: number;
  programCourseId?: number;
  classId?: number;
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
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryClassHoliday(
  id: number,
  body: LibraryClassHolidayUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryClassHoliday(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
