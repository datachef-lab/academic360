import type { StudentDto, ProfileInfo } from "@repo/db/dtos/user";
import axiosInstance from "@/utils/api";

export async function fetchStudentByUid(uid: string): Promise<StudentDto> {
  const res = await axiosInstance.get(`/api/students/uid/${uid}`);
  return res.data.payload as StudentDto;
}

export type StudentSearchItem = Pick<StudentDto, "id" | "uid"> & { name?: string | null };

export async function getSearchedStudents(
  searchQuery: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<{ content: StudentSearchItem[]; totalElements: number; totalPages: number }> {
  const res = await axiosInstance.get(`/api/students/search`, {
    params: { searchText: searchQuery, page, pageSize },
  });
  return res.data.payload;
}

export async function getAllStudents(
  page: number = 1,
  pageSize: number = 10,
): Promise<{ content: StudentDto[]; totalElements: number; totalPages: number }> {
  const res = await axiosInstance.get(`/api/students`, {
    params: { page, pageSize },
  });
  return res.data.payload;
}

export async function getStudentById(id: number): Promise<StudentDto> {
  const res = await axiosInstance.get(`/api/students/${id}`);
  return res.data.payload as StudentDto;
}

export async function fetchUserProfile(userId: number): Promise<ProfileInfo> {
  const res = await axiosInstance.get(`/api/users/${userId}/profile`);
  return res.data as ProfileInfo;
}

export async function getFilteredStudents(
  filters: Record<string, string>,
): Promise<{ content: StudentDto[]; totalElements: number; totalPages: number }> {
  const res = await axiosInstance.get(`/api/students/filter`, {
    params: filters,
  });
  return res.data.payload;
}

/** Same search rules as /api/students/search; used as fallback after UID lookup. */
export async function getSearchedStudentsByRollNumber(
  searchText: string,
): Promise<StudentDto | null> {
  const res = await axiosInstance.get(`/api/students/search-rollno`, {
    params: { searchText: searchText.trim(), page: 1, pageSize: 10 },
  });
  const payload = res.data?.payload as {
    content?: Array<{ id: number }>;
  };
  const first = payload?.content?.[0];
  if (!first?.id) return null;
  return getStudentById(first.id);
}

// Online students (via WebSocket tracking on backend)
export async function getOnlineStudents(): Promise<StudentDto[]> {
  const res = await axiosInstance.get(`/api/students/online`);
  return (res.data?.payload ?? []) as StudentDto[];
}
