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
  checkedInCount: number;
  checkedOutCount: number;
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

export type LibraryEntryExitPreviewUser = {
  userId: number;
  userType: string;
  name: string;
  image: string | null;
  isActive: boolean | null;
  uid: string | null;
  rfid: string | null;
  rollNumber: string | null;
  registrationNumber: string | null;
  classRollNumber: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  staffCode: string | null;
  attendanceCode: string | null;
  classOrSemester: string | null;
  shift: string | null;
  section: string | null;
  programCourse: string | null;
  programCourseShortName: string | null;
  affiliation: string | null;
  affiliationShortName: string | null;
  regulationType: string | null;
  regulationTypeShortName: string | null;
};

export type LibraryEntryExitPreviewCirculationRow = {
  id: number;
  accessNumber: string | null;
  title: string | null;
  author: string | null;
  borrowingType: string | null;
  status: string;
  issuedTimestamp: string | null;
  approvedReturnTimestamp: string | null;
  returnTimestamp: string | null;
  daysLate: number;
};

export type LibraryEntryExitPreviewPayload = {
  user: LibraryEntryExitPreviewUser;
  circulationRows: LibraryEntryExitPreviewCirculationRow[];
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

export async function getLibraryEntryExitPreview(
  userId: number,
): Promise<ApiResponse<LibraryEntryExitPreviewPayload>> {
  const response = await axiosInstance.get<ApiResponse<LibraryEntryExitPreviewPayload>>(
    `${BASE_URL}/preview/${userId}`,
  );
  return response.data;
}

export async function downloadLibraryEntryExitExcel(
  filters: Omit<LibraryEntryExitFilters, "page" | "limit">,
): Promise<Blob> {
  const response = await axiosInstance.get(`${BASE_URL}/download`, {
    params: filters,
    responseType: "blob",
  });
  return response.data as Blob;
}
