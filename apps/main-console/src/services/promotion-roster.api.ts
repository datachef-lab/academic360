import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";

const BASE = "/api/v1/batches/promotion-roster";

/** Same value as backend `SEMESTER_PROMOTION_SOCKET_OP` — use to filter socket `progress_update` events. */
export const SEMESTER_PROMOTION_SOCKET_OP = "semester_promotion";

export type PromotionRosterBucket = "all" | "eligible" | "ineligible" | "suspended" | "promoted";

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
  bucket: "eligible" | "ineligible" | "suspended" | "promoted";
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
    suspended: number;
    promoted: number;
  } | null;
};

export async function getPromotionRoster(params: {
  academicYearId: number;
  fromSessionId: number;
  fromClassId: number;
  toSessionId: number;
  toClassId: number;
  affiliationIds?: number[];
  regulationTypeIds?: number[];
  programCourseIds?: number[];
  shiftIds?: number[];
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
      affiliationId: params.affiliationIds?.join(",") || undefined,
      regulationTypeId: params.regulationTypeIds?.join(",") || undefined,
      programCourseId: params.programCourseIds?.join(",") || undefined,
      shiftId: params.shiftIds?.join(",") || undefined,
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
  suspended: number;
  promoted: number;
};

export async function getPromotionRosterBucketCounts(params: {
  academicYearId: number;
  fromSessionId: number;
  fromClassId: number;
  toSessionId: number;
  toClassId: number;
  affiliationIds?: number[];
  regulationTypeIds?: number[];
  programCourseIds?: number[];
  shiftIds?: number[];
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
        affiliationId: params.affiliationIds?.join(",") || undefined,
        regulationTypeId: params.regulationTypeIds?.join(",") || undefined,
        programCourseId: params.programCourseIds?.join(",") || undefined,
        shiftId: params.shiftIds?.join(",") || undefined,
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
  updated: number;
  skipped: { studentId: number; reason: string }[];
};

export async function checkFeeStructuresForTarget(params: {
  academicYearId: number;
  toClassId: number;
  programCourseIds?: number[];
  shiftIds?: number[];
}): Promise<{ exists: boolean; count: number }> {
  const res = await axiosInstance.get<ApiResponse<{ exists: boolean; count: number }>>(
    `${BASE}/fee-structure-check`,
    {
      params: {
        academicYearId: params.academicYearId,
        toClassId: params.toClassId,
        programCourseId: params.programCourseIds?.join(",") || undefined,
        shiftId: params.shiftIds?.join(",") || undefined,
      },
    },
  );
  const p = res.data.payload;
  if (p == null) return { exists: false, count: 0 };
  return p;
}

export async function checkCourseDesignForTarget(params: {
  academicYearId: number;
  toClassId: number;
  programCourseIds?: number[];
  affiliationIds?: number[];
  regulationTypeIds?: number[];
}): Promise<{ exists: boolean; count: number }> {
  const res = await axiosInstance.get<ApiResponse<{ exists: boolean; count: number }>>(
    `${BASE}/course-design-check`,
    {
      params: {
        academicYearId: params.academicYearId,
        toClassId: params.toClassId,
        programCourseId: params.programCourseIds?.join(",") || undefined,
        affiliationId: params.affiliationIds?.join(",") || undefined,
        regulationTypeId: params.regulationTypeIds?.join(",") || undefined,
      },
    },
  );
  const p = res.data.payload;
  if (p == null) return { exists: false, count: 0 };
  return p;
}

export async function bulkPromoteSemesterStudents(body: {
  academicYearId: number;
  fromSessionId: number;
  fromClassId: number;
  toSessionId: number;
  toClassId: number;
  affiliationIds?: number[];
  regulationTypeIds?: number[];
  programCourseIds?: number[];
  shiftIds?: number[];
  studentIds: number[];
}): Promise<BulkSemesterPromoteResult> {
  const res = await axiosInstance.post<ApiResponse<BulkSemesterPromoteResult>>(`${BASE}/promote`, {
    ...body,
    affiliationId: body.affiliationIds?.join(",") || undefined,
    regulationTypeId: body.regulationTypeIds?.join(",") || undefined,
    programCourseId: body.programCourseIds?.join(",") || undefined,
    shiftId: body.shiftIds?.join(",") || undefined,
  });
  const p = res.data.payload;
  if (p == null) {
    throw new Error("No bulk promote payload");
  }
  return p;
}
