import type { RealtimeTrackerFilters } from "../types/realtime-tracker-types";

/** Matches backend `canonicalRealtimeTrackerFilters` (sessionIds resolved server-side). */
export function canonicalRealtimeTrackerFilters(
  filters: RealtimeTrackerFilters,
): RealtimeTrackerFilters {
  const { sessionIds: _sessionIds, ...rest } = filters;
  const out: RealtimeTrackerFilters = {};
  const copyInts = (
    key: keyof Pick<
      RealtimeTrackerFilters,
      | "academicYearIds"
      | "programCourseIds"
      | "classIds"
      | "shiftIds"
      | "streamIds"
      | "courseLevelIds"
      | "regulationTypeIds"
      | "affiliationIds"
      | "categoryIds"
      | "religionIds"
    >,
  ) => {
    const v = rest[key];
    if (v?.length) out[key] = [...v].sort((a, b) => a - b);
  };
  copyInts("academicYearIds");
  copyInts("programCourseIds");
  copyInts("classIds");
  copyInts("shiftIds");
  copyInts("streamIds");
  copyInts("courseLevelIds");
  copyInts("regulationTypeIds");
  copyInts("affiliationIds");
  copyInts("categoryIds");
  copyInts("religionIds");
  if (rest.genders?.length) out.genders = [...rest.genders].sort();
  if (rest.paymentStatuses?.length) {
    out.paymentStatuses = [...rest.paymentStatuses].sort();
  }
  if (rest.paymentModes?.length) out.paymentModes = [...rest.paymentModes].sort();
  if (rest.dateFrom) out.dateFrom = rest.dateFrom;
  if (rest.dateTo) out.dateTo = rest.dateTo;
  return out;
}

/** Stable React Query / socket subscription key (aligned with backend room hash input). */
export function realtimeTrackerFiltersKey(filters: RealtimeTrackerFilters): string {
  return JSON.stringify(canonicalRealtimeTrackerFilters(filters));
}

export function realtimeTrackerFiltersMatch(
  a: RealtimeTrackerFilters | undefined,
  b: RealtimeTrackerFilters | undefined,
): boolean {
  return realtimeTrackerFiltersKey(a ?? {}) === realtimeTrackerFiltersKey(b ?? {});
}
