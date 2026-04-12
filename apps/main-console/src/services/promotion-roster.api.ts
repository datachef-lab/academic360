import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";

const BASE = "/api/v1/batches/promotion-roster";

/** Same value as backend `SEMESTER_PROMOTION_SOCKET_OP` — use to filter socket `progress_update` events. */
export const SEMESTER_PROMOTION_SOCKET_OP = "semester_promotion";

export type PromotionRosterBucket = "all" | "eligible" | "ineligible" | "inactive" | "promoted";

export type PromotionRosterSort = "uid" | "rollNumber" | "registrationNumber";

export type PromotionRosterRow = {
  studentId: number;
  promotionId: number;
  uid: string;
  rollNumber: string | null;
  registrationNumber: string | null;
  studentName: string;
  affiliationId: number | null;
  affiliationName: string | null;
  regulationName: string | null;
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
  } | null;
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
  /** When true, bucket totals are included (slow). Default false — use `getPromotionRosterBucketCounts`. */
  includeBucketCounts?: boolean;
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
      includeBucketCounts: params.includeBucketCounts === true ? true : undefined,
    },
  });
  const p = res.data.payload;
  if (!p) {
    throw new Error("No promotion roster payload");
  }
  return p;
}

export type PromotionRosterBucketCounts = {
  all: number;
  eligible: number;
  ineligible: number;
  inactive: number;
  promoted: number;
};

export async function getPromotionRosterBucketCounts(params: {
  academicYearId: number;
  fromSessionId: number;
  fromClassId: number;
  toSessionId: number;
  toClassId: number;
  affiliationId?: number;
  regulationTypeId?: number;
  programCourseId?: number;
  shiftId?: number;
  q?: string;
}): Promise<PromotionRosterBucketCounts> {
  const res = await axiosInstance.get<ApiResponse<PromotionRosterBucketCounts>>(
    `${BASE}/bucket-counts`,
    {
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
        q: params.q,
      },
    },
  );
  const p = res.data.payload;
  if (p == null) {
    throw new Error("No promotion roster bucket counts payload");
  }
  return p;
}

export type BulkSemesterPromoteResult = {
  created: number;
  skipped: { studentId: number; reason: string }[];
};

export async function bulkPromoteSemesterStudents(body: {
  academicYearId: number;
  fromSessionId: number;
  fromClassId: number;
  toSessionId: number;
  toClassId: number;
  affiliationId?: number;
  regulationTypeId?: number;
  programCourseId?: number;
  shiftId?: number;
  studentIds: number[];
}): Promise<BulkSemesterPromoteResult> {
  const res = await axiosInstance.post<ApiResponse<BulkSemesterPromoteResult>>(
    `${BASE}/promote`,
    body,
  );
  const p = res.data.payload;
  if (p == null) {
    throw new Error("No bulk promote payload");
  }
  return p;
}
