import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";

const BASE = "/api/v1/batches/promotion-roster";

export type PromotionRosterBucket = "all" | "eligible" | "ineligible" | "inactive" | "promoted";

export type PromotionRosterSort = "uid" | "rollNumber" | "registrationNumber";

export type PromotionRosterRow = {
  studentId: number;
  promotionId: number;
  uid: string;
  rollNumber: string | null;
  registrationNumber: string | null;
  studentName: string;
  programCourseName: string | null;
  shiftName: string;
  fromClassName: string;
  toClassName: string;
  bucket: "eligible" | "ineligible" | "inactive" | "promoted";
};

export type PromotionRosterResponse = {
  content: PromotionRosterRow[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  counts: {
    all: number;
    eligible: number;
    ineligible: number;
    inactive: number;
    promoted: number;
  };
};

export async function getPromotionRoster(params: {
  academicYearId: number;
  fromSessionId: number;
  fromClassId: number;
  toSessionId: number;
  toClassId: number;
  affiliationId?: number;
  regulationTypeId?: number;
  programCourseId?: number;
  shiftId?: number;
  bucket?: PromotionRosterBucket;
  sortBy?: PromotionRosterSort;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<PromotionRosterResponse> {
  const res = await axiosInstance.get<ApiResponse<PromotionRosterResponse>>(BASE, {
    params: {
      academicYearId: params.academicYearId,
      fromSessionId: params.fromSessionId,
      fromClassId: params.fromClassId,
      toSessionId: params.toSessionId,
      toClassId: params.toClassId,
      affiliationId: params.affiliationId,
      regulationTypeId: params.regulationTypeId,
      programCourseId: params.programCourseId,
      shiftId: params.shiftId,
      bucket: params.bucket ?? "all",
      sortBy: params.sortBy ?? "uid",
      sortDir: params.sortDir ?? "asc",
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      q: params.q,
    },
  });
  const p = res.data.payload;
  if (!p) {
    throw new Error("No promotion roster payload");
  }
  return p;
}
