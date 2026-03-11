import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";
import type {
  AdmitCardSearchResponse,
  DistributeAdmitCardRequest,
  AdmitCardDistributionRow,
} from "@/types/exams/admit-card";

export async function searchCandidate(params: {
  searchTerm: string;
  examGroupId?: number | null;
}): Promise<AdmitCardSearchResponse> {
  const response = await axiosInstance.get<AdmitCardSearchResponse | ApiResponse<AdmitCardSearchResponse>>(
    "/api/admit-card/search",
    {
      params: {
        search_term: params.searchTerm,
        ...(params.examGroupId ? { exam_group_id: params.examGroupId } : {}),
      },
    },
  );

  const data = response.data as any;
  return "payload" in data ? data.payload : data;
}

export async function distributeAdmitCard(
  body: DistributeAdmitCardRequest,
): Promise<ApiResponse<unknown> | { message: string }> {
  const response = await axiosInstance.post<ApiResponse<unknown> | { message: string }>(
    "/api/admit-card/distribute",
    body,
  );
  return response.data;
}

export async function downloadAdmitCard(params: { examId: number; studentId: number }): Promise<Blob> {
  const response = await axiosInstance.get<Blob>("/api/exams/schedule/admit-card/download/single", {
    params: {
      examId: params.examId,
      studentId: params.studentId,
    },
    responseType: "blob",
  });
  return response.data;
}

export async function fetchAdmitCardDistributions(params?: {
  examGroupId?: number | null;
}): Promise<AdmitCardDistributionRow[]> {
  const response = await axiosInstance.get<AdmitCardDistributionRow[] | ApiResponse<AdmitCardDistributionRow[]>>(
    "/api/admit-card/distributions",
    {
      params: params?.examGroupId ? { exam_group_id: params.examGroupId } : undefined,
    },
  );

  const data = response.data as any;
  return "payload" in data ? data.payload : data;
}

export async function downloadAdmitCardDistributionsCsv(params?: { examGroupId?: number | null }): Promise<Blob> {
  const response = await axiosInstance.get("/api/admit-card/distributions/download", {
    params: params?.examGroupId ? { exam_group_id: params.examGroupId } : undefined,
    responseType: "blob",
  });
  return response.data;
}
