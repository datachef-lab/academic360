import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";
import type { PromotionBuilderDto, PromotionClauseDto } from "@repo/db";

const BASE = "/api/v1/batches";

// ── Promotion Builders ──

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

export type PromotionBuilderRulePayload = {
  promotionClauseId: number;
  operator: "EQUALS" | "NONE_IN";
  classIds: number[];
};

export async function createPromotionBuilder(data: {
  affiliationId: number;
  targetClassId: number;
  logic: "AUTO_PROMOTE" | "CONDITIONAL";
  isActive?: boolean;
  rules?: PromotionBuilderRulePayload[];
}): Promise<PromotionBuilderDto> {
  const res = await axiosInstance.post<ApiResponse<PromotionBuilderDto>>(
    `${BASE}/promotion-builders`,
    data,
  );
  return res.data.payload;
}

export async function updatePromotionBuilder(
  id: number,
  data: {
    logic?: "AUTO_PROMOTE" | "CONDITIONAL";
    isActive?: boolean;
    rules?: PromotionBuilderRulePayload[];
  },
): Promise<PromotionBuilderDto> {
  const res = await axiosInstance.put<ApiResponse<PromotionBuilderDto>>(
    `${BASE}/promotion-builders/${id}`,
    data,
  );
  return res.data.payload;
}

export async function replacePromotionBuilderRules(
  id: number,
  rules: PromotionBuilderRulePayload[],
): Promise<PromotionBuilderDto> {
  const res = await axiosInstance.put<ApiResponse<PromotionBuilderDto>>(
    `${BASE}/promotion-builders/${id}/rules`,
    { rules },
  );
  return res.data.payload;
}

export async function deletePromotionBuilder(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE}/promotion-builders/${id}`);
}

// ── Promotion Clauses ──

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

export async function createPromotionClause(data: {
  name: string;
  description?: string;
  color?: string;
  bgColor?: string;
  isActive?: boolean;
}): Promise<PromotionClauseDto> {
  const res = await axiosInstance.post<ApiResponse<PromotionClauseDto>>(
    `${BASE}/promotion-clauses`,
    data,
  );
  return res.data.payload;
}

export async function updatePromotionClause(
  id: number,
  data: {
    name?: string;
    description?: string;
    color?: string;
    bgColor?: string;
    isActive?: boolean;
    classIds?: number[];
  },
): Promise<PromotionClauseDto> {
  const res = await axiosInstance.put<ApiResponse<PromotionClauseDto>>(
    `${BASE}/promotion-clauses/${id}`,
    data,
  );
  return res.data.payload;
}

export async function replacePromotionClauseClassMappings(
  id: number,
  classIds: number[],
): Promise<PromotionClauseDto> {
  const res = await axiosInstance.put<ApiResponse<PromotionClauseDto>>(
    `${BASE}/promotion-clauses/${id}/class-mappings`,
    { classIds },
  );
  return res.data.payload;
}

export async function deletePromotionClause(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE}/promotion-clauses/${id}`);
}
