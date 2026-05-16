import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";
import type { PromotionStatusT } from "@repo/db";

const BASE = "/api/v1/batches/promotion-statuses";

export async function getPromotionStatuses(opts?: {
  isActive?: boolean;
}): Promise<PromotionStatusT[]> {
  const res = await axiosInstance.get<ApiResponse<PromotionStatusT[]>>(BASE, {
    params: opts?.isActive === undefined ? undefined : { isActive: opts.isActive },
  });
  return res.data.payload ?? [];
}

export async function getPromotionStatusById(id: number): Promise<PromotionStatusT | null> {
  const res = await axiosInstance.get<ApiResponse<PromotionStatusT>>(`${BASE}/${id}`);
  return res.data.payload ?? null;
}

export async function createPromotionStatusApi(
  data: Partial<PromotionStatusT>,
): Promise<PromotionStatusT> {
  const res = await axiosInstance.post<ApiResponse<PromotionStatusT>>(BASE, data);
  return res.data.payload;
}

export async function updatePromotionStatusApi(
  id: number,
  data: Partial<PromotionStatusT>,
): Promise<PromotionStatusT> {
  const res = await axiosInstance.put<ApiResponse<PromotionStatusT>>(`${BASE}/${id}`, data);
  return res.data.payload;
}

export async function deletePromotionStatusApi(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE}/${id}`);
}
