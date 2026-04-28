import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryUserType = "ADMIN" | "STUDENT" | "FACULTY" | "STAFF" | "PARENTS";
export type LibraryCurrentStatus = "CHECKED_IN" | "CHECKED_OUT";

export type LibraryEntryExitRow = {
  id: number;
  legacyLibraryEntryExitId: number | null;
  userId: number;
  userName: string | null;
  userType: LibraryUserType | null;
  image: string | null;
  studentUid: string | null;
  staffUid: string | null;
  staffAttendanceCode: string | null;
  currentStatus: LibraryCurrentStatus;
  entryTimestamp: string;
  exitTimestamp: string | null;
};

export type LibraryEntryExitListPayload = {
  rows: LibraryEntryExitRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryEntryExitFilters = {
  page: number;
  limit: number;
  search?: string;
  userType?: LibraryUserType;
  currentStatus?: LibraryCurrentStatus;
  date?: string;
};

export type LibrarySearchUser = {
  userId: number;
  userName: string;
  userType: string;
  uid: string | null;
  image: string | null;
  studentUid: string | null;
};

export type LibrarySearchUsersPayload = {
  rows: LibrarySearchUser[];
  total: number;
  page: number;
  limit: number;
};

const BASE_URL = "/api/library/entry-exit";

export async function getLibraryEntryExitList(
  filters: LibraryEntryExitFilters,
): Promise<ApiResponse<LibraryEntryExitListPayload>> {
  const response = await axiosInstance.get<ApiResponse<LibraryEntryExitListPayload>>(BASE_URL, {
    params: filters,
  });
  return response.data;
}

export async function markLibraryEntryExitAsCheckedOut(
  id: number,
): Promise<ApiResponse<LibraryEntryExitRow>> {
  const response = await axiosInstance.put<ApiResponse<LibraryEntryExitRow>>(`${BASE_URL}/${id}`, {
    currentStatus: "CHECKED_OUT",
  });
  return response.data;
}

export async function createLibraryEntryExit(
  userId: number,
): Promise<ApiResponse<LibraryEntryExitRow>> {
  const response = await axiosInstance.post<ApiResponse<LibraryEntryExitRow>>(BASE_URL, {
    userId,
    currentStatus: "CHECKED_IN",
  });
  return response.data;
}

export async function searchLibraryUsers(
  search: string,
  page: number,
  limit: number = 8,
): Promise<ApiResponse<LibrarySearchUsersPayload>> {
  const response = await axiosInstance.get<ApiResponse<LibrarySearchUsersPayload>>(
    `${BASE_URL}/search-users`,
    {
      params: { search, page, limit },
    },
  );
  return response.data;
}
