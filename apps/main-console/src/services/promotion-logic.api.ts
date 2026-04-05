import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";
import type { PromotionBuilderDto, PromotionClauseDto } from "@repo/db";

const BASE = "/api/v1/batches";

export async function getPromotionBuilders(affiliationId?: number): Promise<PromotionBuilderDto[]> {
  const res = await axiosInstance.get<ApiResponse<PromotionBuilderDto[]>>(
    `${BASE}/promotion-builders`,
    {
      params: affiliationId != null ? { affiliationId } : undefined,
    },
  );
  return res.data.payload ?? [];
}

export async function getPromotionClauses(opts?: {
  isActive?: boolean;
}): Promise<PromotionClauseDto[]> {
  const res = await axiosInstance.get<ApiResponse<PromotionClauseDto[]>>(
    `${BASE}/promotion-clauses`,
    {
      params: opts?.isActive === undefined ? undefined : { isActive: opts.isActive },
    },
  );
  return res.data.payload ?? [];
}
