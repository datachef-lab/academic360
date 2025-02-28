import { ApiResonse } from "@/types/api-response";
import { AnnualIncome } from "@/types/resources/annual-income";
import axiosInstance from "@/utils/api";

export async function annualIncome(): Promise<ApiResonse<AnnualIncome>> {
  const response = await axiosInstance.get("/api/annual-incomes", { withCredentials: true });
  return response.data;
}
