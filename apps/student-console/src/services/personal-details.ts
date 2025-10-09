import { ingaxiosInstance as api } from "@/lib/utils";
import type { ApiResponse } from "@/types/api-response";

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
}

export async function fetchPersonalDetailsByStudentId(studentId: number) {
  const res = await api.get<ApiResponse<PersonalDetailsDto>>(`/api/personal-details/student/${studentId}`);
  return res.data.payload as PersonalDetailsDto;
}
