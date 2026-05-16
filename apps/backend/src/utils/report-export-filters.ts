/**
 * Optional multi-select filters for report Excel exports (query string: comma-separated ids).
 */
export type ReportExportFilters = {
  programCourseIds?: number[];
  affiliationIds?: number[];
  regulationTypeIds?: number[];
  /** Class / semester ids from `classes` */
  classIds?: number[];
};

function parseIdList(v: unknown): number[] | undefined {
  if (v == null || v === "") return undefined;
  const s = Array.isArray(v) ? v.map(String).join(",") : String(v);
  const ids = s
    .split(/[,]/)
    .map((x) => Number(String(x).trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return ids.length ? [...new Set(ids)] : undefined;
}

export function parseReportExportFilters(
  q: Record<string, unknown>,
): ReportExportFilters {
  return {
    programCourseIds: parseIdList(q.programCourseIds),
    affiliationIds: parseIdList(q.affiliationIds),
    regulationTypeIds: parseIdList(q.regulationTypeIds),
    classIds: parseIdList(q.classIds),
  };
}
