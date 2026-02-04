import axiosInstance from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

export interface IdNameDto {
  id: number;
  name: string;
  stateId?: number;
}

export async function fetchCities(params?: { stateId?: number }): Promise<IdNameDto[]> {
  const res = await axiosInstance.get<ApiResponse<IdNameDto[] | { content: IdNameDto[] }>>("/api/cities", {
    params,
  });
  const p = res.data.payload as unknown;
  const arr = Array.isArray(p) ? p : (p as { content?: IdNameDto[] })?.content;
  return arr || [];
}

export async function fetchDistricts(params?: { stateId?: number; cityId?: number }): Promise<IdNameDto[]> {
  const res = await axiosInstance.get<ApiResponse<IdNameDto[] | { content: IdNameDto[] }>>("/api/districts", {
    params,
  });
  const p = res.data.payload as unknown;
  const arr = Array.isArray(p) ? p : (p as { content?: IdNameDto[] })?.content;
  return arr || [];
}
