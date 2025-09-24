import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import type { PersonT } from "@repo/db/schemas/models";

const BASE_URL = "/api/persons";

// Request payload should use ids for relations per Person model
export type PersonUpdateRequest = Partial<
  Pick<PersonT, "title" | "name" | "email" | "phone" | "aadhaarCardNumber" | "gender" | "maritalStatus">
> & {
  occupationId?: number | null;
  qualificationId?: number | null;
  officeAddressId?: number | null;
};

export async function updatePerson(id: number, payload: PersonUpdateRequest): Promise<ApiResponse<PersonT>> {
  const res = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
  return res.data as ApiResponse<PersonT>;
}

export async function createPerson(payload: PersonUpdateRequest): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post(`${BASE_URL}`, payload);
  return res.data as ApiResponse<{ id: number }>;
}
