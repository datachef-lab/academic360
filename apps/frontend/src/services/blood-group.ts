import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { BloodGroup } from "@/types/resources/blood-group";
import axiosInstance from "@/utils/api";

export async function bloodGroup(): Promise<ApiResonse<PaginatedResponse<BloodGroup>>> {
  const response = await axiosInstance.get("/api/blood-groups", { withCredentials: true });
  return response.data;
}
