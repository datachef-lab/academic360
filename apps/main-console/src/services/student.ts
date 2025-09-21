import { StudentDto } from "@repo/db/dtos/user";
import axiosInstance from "@/utils/api";

export async function fetchStudentByUid(uid: string): Promise<StudentDto> {
  const res = await axiosInstance.get(`/api/students/uid/${uid}`);
  return res.data.payload as StudentDto;
}

export async function getSearchedStudents(
  searchQuery: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<{ content: StudentDto[]; totalElements: number; totalPages: number }> {
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
