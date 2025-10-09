import { ingaxiosInstance as api } from "@/lib/utils";
import type { ApiResponse } from "@/types/api-response";

export interface IdNameDto {
  id: number;
  name: string;
  stateId?: number;
}

export async function fetchPoliceStations(params?: { stateId?: number; stateName?: string; search?: string }) {
  const res = await api.get("/api/police-stations", {
    params: { stateId: params?.stateId, stateName: params?.stateName, search: params?.search },
  });
  const p = (res.data as any)?.payload as IdNameDto[] | { content: IdNameDto[] } | undefined;
  const arr = (Array.isArray(p) ? p : (p as any)?.content) as IdNameDto[] | undefined;
  return arr || [];
}

export async function fetchPostOffices(params?: { stateId?: number; stateName?: string; search?: string }) {
  const res = await api.get("/api/post-offices", {
    params: { stateId: params?.stateId, stateName: params?.stateName, search: params?.search },
  });
  const p = (res.data as any)?.payload as IdNameDto[] | { content: IdNameDto[] } | undefined;
  const arr = (Array.isArray(p) ? p : (p as any)?.content) as IdNameDto[] | undefined;
  return arr || [];
}

export async function fetchCities(params?: { stateId?: number }) {
  const res = await api.get("/api/cities", { params });
  const p = (res.data as any)?.payload as IdNameDto[] | { content: IdNameDto[] } | undefined;
  const arr = (Array.isArray(p) ? p : (p as any)?.content) as IdNameDto[] | undefined;
  return arr || [];
}

export async function fetchDistricts(params?: { stateId?: number; cityId?: number }) {
  const res = await api.get("/api/districts", { params });
  const p = (res.data as any)?.payload as IdNameDto[] | { content: IdNameDto[] } | undefined;
  const arr = (Array.isArray(p) ? p : (p as any)?.content) as IdNameDto[] | undefined;
  return arr || [];
}
