/** Shared multi-select filters for Realtime Tracker (affiliation registration + fee MIS). */
export type RealtimeTrackerFilters = {
  academicYearIds?: number[];
  sessionIds?: number[];
  programCourseIds?: number[];
  classIds?: number[];
  shiftIds?: number[];
  streamIds?: number[];
  courseLevelIds?: number[];
  regulationTypeIds?: number[];
  affiliationIds?: number[];
  categoryIds?: number[];
  religionIds?: number[];
  genders?: string[];
  paymentStatuses?: string[];
  paymentModes?: string[];
  dateFrom?: string;
  dateTo?: string;
};

function parseIntList(value: unknown): number[] | undefined {
  if (value == null || value === "") return undefined;
  const raw = Array.isArray(value) ? value : String(value).split(",");
  const nums = raw
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? [...new Set(nums)] : undefined;
}

function parseStringList(value: unknown): string[] | undefined {
  if (value == null || value === "") return undefined;
  const raw = Array.isArray(value) ? value : String(value).split(",");
  const items = raw.map((v) => String(v).trim()).filter(Boolean);
  return items.length ? [...new Set(items)] : undefined;
}

function parseOptionalString(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const s = String(value).trim();
  return s || undefined;
}

/** Stable room/API key: sorted arrays, no sessionIds (resolved at query time). */
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
  if (rest.paymentModes?.length)
    out.paymentModes = [...rest.paymentModes].sort();
  if (rest.dateFrom) out.dateFrom = rest.dateFrom;
  if (rest.dateTo) out.dateTo = rest.dateTo;
  return out;
}

export function parseRealtimeTrackerFilters(
  q: Record<string, unknown>,
): RealtimeTrackerFilters {
  return {
    academicYearIds: parseIntList(q.academicYearIds ?? q.academicYearId),
    sessionIds: parseIntList(q.sessionIds ?? q.sessionId),
    programCourseIds: parseIntList(q.programCourseIds ?? q.programCourseId),
    classIds: parseIntList(q.classIds ?? q.classId),
    shiftIds: parseIntList(q.shiftIds ?? q.shiftId),
    streamIds: parseIntList(q.streamIds),
    courseLevelIds: parseIntList(q.courseLevelIds),
    regulationTypeIds: parseIntList(q.regulationTypeIds),
    affiliationIds: parseIntList(q.affiliationIds),
    categoryIds: parseIntList(q.categoryIds),
    religionIds: parseIntList(q.religionIds),
    genders: parseStringList(q.genders),
    paymentStatuses: parseStringList(q.paymentStatuses),
    paymentModes: parseStringList(q.paymentModes),
    dateFrom: parseOptionalString(q.dateFrom),
    dateTo: parseOptionalString(q.dateTo),
  };
}
