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
  const payload = res.data?.payload;
  return Array.isArray(payload) ? payload : [];
}

/** Active builder for affiliation + target (“promoted to”) class — used to show semester rule lines in the roster. */
export async function getPromotionBuilderByTarget(
  affiliationId: number,
  targetClassId: number,
): Promise<PromotionBuilderDto | null> {
  const res = await axiosInstance.get<ApiResponse<PromotionBuilderDto | null>>(
    `${BASE}/promotion-builders/by-target`,
    {
      params: { affiliationId, targetClassId },
    },
  );
  return res.data.payload ?? null;
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
