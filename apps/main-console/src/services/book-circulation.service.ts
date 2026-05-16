import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type BookCirculationUserType = "ADMIN" | "STUDENT" | "FACULTY" | "STAFF" | "PARENTS";

export type BookCirculationStatus = "ISSUED" | "OVERDUE" | "REISSUED" | "RETURNED";

export type BookCirculationRow = {
  userId: number;
  userName: string | null;
  userType: BookCirculationUserType | null;
  studentUid: string | null;
  staffUid: string | null;
  attendanceCode: string | null;
  image: string | null;
  recentBooks: {
    issued: number;
    overdue: number;
    returned: number;
  };
  daysLate: number;
  fine: number;
  lastUpdatedAt: string | null;
};

export type BookCirculationListPayload = {
  rows: BookCirculationRow[];
  total: number;
  page: number;
  limit: number;
};

export type BookCirculationPreviewUser = {
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

export type BookCirculationPreviewRow = {
  id: number;
  copyDetailsId: number;
  borrowingTypeId: number | null;
  accessNumber: string | null;
  title: string | null;
  author: string | null;
  publication: string | null;
  frontCover: string | null;
  borrowingType: string | null;
  status: "ISSUED" | "RETURNED";
  issuedTimestamp: string;
  returnTimestamp: string;
  actualReturnTimestamp: string | null;
  fine: number;
  fineWaiver: number;
  netFine: number;
  latestReissueReturnTimestamp: string | null;
};

export type BookCirculationPreviewPayload = {
  user: BookCirculationPreviewUser;
  rows: BookCirculationPreviewRow[];
};

export type BookCirculationMetaPayload = {
  bookOptions: Array<{
    copyDetailsId: number;
    accessNumber: string | null;
    title: string | null;
    author: string | null;
    publication: string | null;
    frontCover: string | null;
  }>;
  borrowingTypeOptions: Array<{ id: number; name: string }>;
};

export type BookCirculationFilters = {
  page: number;
  limit: number;
  search?: string;
  userType?: BookCirculationUserType;
  status?: BookCirculationStatus;
  issueDate?: string;
};

const BASE_URL = "/api/library/book-circulation";

export async function getBookCirculationList(
  filters: BookCirculationFilters,
): Promise<ApiResponse<BookCirculationListPayload>> {
  const response = await axiosInstance.get<ApiResponse<BookCirculationListPayload>>(BASE_URL, {
    params: filters,
  });
  return response.data;
}

export async function getBookCirculationPreview(
  userId: number,
): Promise<ApiResponse<BookCirculationPreviewPayload>> {
  const response = await axiosInstance.get<ApiResponse<BookCirculationPreviewPayload>>(
    `${BASE_URL}/preview/${userId}`,
  );
  return response.data;
}

export async function performBookCirculationAction(
  id: number,
  action: "ISSUE" | "REISSUE" | "RETURN",
): Promise<ApiResponse<null>> {
  const response = await axiosInstance.post<ApiResponse<null>>(`${BASE_URL}/${id}/action`, {
    action,
  });
  return response.data;
}

export async function getBookCirculationMeta(): Promise<ApiResponse<BookCirculationMetaPayload>> {
  const response = await axiosInstance.get<ApiResponse<BookCirculationMetaPayload>>(
    `${BASE_URL}/meta`,
  );
  return response.data;
}

export async function downloadBookCirculationExcel(
  filters: Omit<BookCirculationFilters, "page" | "limit">,
): Promise<Blob> {
  const response = await axiosInstance.get(`${BASE_URL}/download`, {
    params: filters,
    responseType: "blob",
  });
  return response.data as Blob;
}

export type BookCirculationUpsertRow = {
  id?: number | null;
  copyDetailsId: number;
  borrowingTypeId?: number | null;
  issueTimestamp: string;
  returnTimestamp: string;
  actualReturnTimestamp?: string | null;
};

export async function upsertBookCirculationRows(
  userId: number,
  rows: BookCirculationUpsertRow[],
): Promise<ApiResponse<null>> {
  const response = await axiosInstance.post<ApiResponse<null>>(`${BASE_URL}/upsert/${userId}`, {
    rows,
  });
  return response.data;
}
