import type { AcademicActivity } from "@/services/academic-activities";
import type { StudentFeeMapping } from "@/services/fees-api";
import type { StudentDto } from "@repo/db/dtos/user";
import { isFeeMappingPaid } from "@/lib/fee-utils";

/** Fields the fee gating needs that aren't on the shared DTO yet. */
type MappingExtras = {
  feeStructure?: {
    class?: { id?: number | null } | null;
    academicYear?: { id?: number | null } | null;
    receiptType?: { appearTypePromotionStatusId?: number | null } | null;
    programCourse?: {
      courseLevel?: { id?: number | null } | null;
      courseLevelId?: number | null;
      stream?: { id?: number | null } | null;
    } | null;
  } | null;
};

type StudentExtras = {
  programCourse?: {
    stream?: { id?: number | null } | null;
    courseLevel?: { id?: number | null } | null;
    courseLevelId?: number | null;
  } | null;
  currentPromotion?: {
    programCourse?: {
      stream?: { id?: number | null } | null;
      courseLevel?: { id?: number | null } | null;
      courseLevelId?: number | null;
    } | null;
  } | null;
};

/** Drop rows the college never means to show: zero-value mappings that were
 * never paid. A paid row stays visible so the student keeps their receipt. */
export function hasFeeValue(mapping: StudentFeeMapping): boolean {
  return Number(mapping.totalPayable ?? 0) > 0 || isFeeMappingPaid(mapping);
}

/** Class ids are seeded in semester order (Semester I = 1, II = 2, …), so
 * sorting by id yields the fixed Sem I → VIII sequence. */
export function feeClassSequence(mapping: StudentFeeMapping): number {
  const id = (mapping as MappingExtras).feeStructure?.class?.id;
  return typeof id === "number" ? id : Number.MAX_SAFE_INTEGER;
}

/**
 * Which fee mappings the student may actually see, mirroring the student-console
 * web app (enrollment-fees/page.tsx `visibleCards`). A mapping shows only while a
 * live "Semester Fee Payment" activity matches it on academic year, appear type,
 * course level, and a currently-open scope for its class and stream.
 *
 * With no activities loaded (none configured, or the request failed) everything
 * shows — same fallback as web, so a metadata outage never hides a student's fees.
 */
export function filterVisibleFeeMappings(
  mappings: StudentFeeMapping[],
  activities: AcademicActivity[],
  student: StudentDto | undefined,
  now: number = Date.now(),
): StudentFeeMapping[] {
  if (!activities.length) return mappings;

  const s = student as StudentExtras | undefined;
  const promotion = s?.currentPromotion;
  const studentStreamId =
    s?.programCourse?.stream?.id ?? promotion?.programCourse?.stream?.id ?? null;
  const studentCourseLevelId =
    s?.programCourse?.courseLevel?.id ??
    s?.programCourse?.courseLevelId ??
    promotion?.programCourse?.courseLevel?.id ??
    promotion?.programCourse?.courseLevelId ??
    null;

  return mappings.filter((mapping) => {
    const fs = (mapping as MappingExtras).feeStructure;
    const cardClassId = fs?.class?.id;
    const cardAyId = fs?.academicYear?.id;
    if (!cardClassId || !cardAyId) return false;

    const cardCourseLevelId =
      fs?.programCourse?.courseLevel?.id ?? fs?.programCourse?.courseLevelId ?? null;
    // A receipt type categorized by appear type (e.g. "Casual Fees" -> Casual) only
    // shows when an activity of the SAME appear type is live, so opening the Regular
    // window doesn't expose Casual fees. Uncategorized (null) types aren't gated.
    const cardAppearTypeId = fs?.receiptType?.appearTypePromotionStatusId ?? null;

    return activities.some((activity) => {
      if (activity.academicYear?.id !== cardAyId) return false;
      if (cardAppearTypeId != null && activity.appearType?.id !== cardAppearTypeId) return false;

      const activityCourseLevelId = activity.courseLevelId ?? null;
      if (activityCourseLevelId != null) {
        // Fall back to the student's own course level when the fee structure
        // doesn't name one.
        const compareTo = cardCourseLevelId ?? studentCourseLevelId;
        if (compareTo != null && activityCourseLevelId !== compareTo) return false;
      }

      return (activity.scopes ?? []).some((scope) => {
        if (!scope.isEnabled) return false;
        if (scope.class?.id !== cardClassId) return false;
        if (studentStreamId != null && scope.stream?.id !== studentStreamId) return false;
        const start = scope.startDate ? new Date(scope.startDate).getTime() : 0;
        const end = scope.endDate ? new Date(scope.endDate).getTime() : Infinity;
        return now >= start && now <= end;
      });
    });
  });
}
