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

export async function getSearchedStudentsByRollNumber(rollNumber: string): Promise<StudentDto> {
  const res = await axiosInstance.get(`/api/students/roll/${rollNumber}`);
  return res.data.payload as StudentDto;
}

// Online students (via WebSocket tracking on backend)
export async function getOnlineStudents(): Promise<StudentDto[]> {
  const res = await axiosInstance.get(`/api/students/online`);
  return (res.data?.payload ?? []) as StudentDto[];
}
