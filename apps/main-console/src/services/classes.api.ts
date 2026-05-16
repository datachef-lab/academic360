import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";

export type ClassRow = {
  id: number;
  name: string;
  shortName: string | null;
  type: string;
  sequence: number | null;
  isActive: boolean | null;
};

export async function fetchAllClasses(): Promise<ClassRow[]> {
  const res = await axiosInstance.get<ApiResponse<ClassRow[]>>("/api/classes");
  return res.data.payload ?? [];
}
