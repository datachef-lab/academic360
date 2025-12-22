import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import type { AdmissionAcademicInfoDto } from "@repo/db/dtos/admissions";

const BASE_URL = "/api/admissions/academic-info";

export async function getAcademicInfoById(id: number): Promise<ApiResponse<AdmissionAcademicInfoDto | null>> {
  const res = await axiosInstance.get(`${BASE_URL}/${id}`);
  return res.data;
}

export async function getAcademicInfoByApplicationFormId(
  applicationFormId: number,
): Promise<ApiResponse<AdmissionAcademicInfoDto | null>> {
  const res = await axiosInstance.get(`${BASE_URL}/application-form/${applicationFormId}`);
  return res.data;
}

export async function createAcademicInfo(
  payload: Partial<AdmissionAcademicInfoDto>,
): Promise<ApiResponse<AdmissionAcademicInfoDto>> {
  const res = await axiosInstance.post(BASE_URL, payload);
  return res.data;
}

export async function updateAcademicInfo(
  id: number,
  payload: Partial<AdmissionAcademicInfoDto>,
): Promise<ApiResponse<AdmissionAcademicInfoDto>> {
  const res = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
  return res.data;
}

export async function deleteAcademicInfo(id: number): Promise<ApiResponse<{ success: boolean }>> {
  const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
  return res.data;
}
