import axiosInstance from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

export interface PersonalDetailsDto {
  id: number;
  userId: number;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  nationalityId?: number | null;
  otherNationality?: string | null;
  aadhaarCardNumber?: string | null;
  ewsStatus?: string | null;
  isEWS?: boolean | null;
}

export async function fetchPersonalDetailsByStudentId(studentId: number): Promise<PersonalDetailsDto> {
  const res = await axiosInstance.get<ApiResponse<PersonalDetailsDto>>(`/api/personal-details/student/${studentId}`);
  return res.data.payload as PersonalDetailsDto;
}
