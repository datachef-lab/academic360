import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type NaacReport = {
  framework: "NAAC";
  criterion: string;
  academicYear: string;
  metrics: Record<string, string | number>;
};

export type NirfReport = {
  framework: "NIRF";
  academicYear: string;
  libraryResources: {
    books: number;
    copies: number;
    eJournals: number;
    annualLibrarySpend: number;
    annualCirculation: number;
  };
};

export type AisheReport = {
  framework: "AISHE";
  academicYear: string;
  library: {
    booksAvailable: number;
    volumesAvailable: number;
    journalsSubscribed: number;
    annualSubscriptionSpend: number;
  };
};

const BASE = "/api/library/reports";

export async function getNaacReport(year: string) {
  const res = await axiosInstance.get<ApiResponse<NaacReport>>(`${BASE}/naac`, {
    params: { year },
  });
  return res.data;
}

export async function getNirfReport(year: string) {
  const res = await axiosInstance.get<ApiResponse<NirfReport>>(`${BASE}/nirf`, {
    params: { year },
  });
  return res.data;
}

export async function getAisheReport(year: string) {
  const res = await axiosInstance.get<ApiResponse<AisheReport>>(`${BASE}/aishe`, {
    params: { year },
  });
  return res.data;
}
