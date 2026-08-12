/**
 * Optional multi-select filters for report Excel exports (query string: comma-separated ids).
 */
export type ReportExportFilters = {
  programCourseIds?: number[];
  affiliationIds?: number[];
  regulationTypeIds?: number[];
  /** Class / semester ids from `classes` */
  classIds?: number[];
  /** Student active/inactive status (`students.active`). Omitted = both. */
  isActive?: boolean;
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

function parseBoolean(v: unknown): boolean | undefined {
  if (v == null || v === "") return undefined;
  const s = String(v).trim().toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  return undefined;
}

export function parseReportExportFilters(
  q: Record<string, unknown>,
): ReportExportFilters {
  return {
    programCourseIds: parseIdList(q.programCourseIds),
    affiliationIds: parseIdList(q.affiliationIds),
    regulationTypeIds: parseIdList(q.regulationTypeIds),
    classIds: parseIdList(q.classIds),
    isActive: parseBoolean(q.isActive),
  };
}

const positiveInts = (ids?: number[]): number[] =>
  ids?.filter((n) => Number.isInteger(n) && n > 0) ?? [];

/**
 * Builds ` AND <col> IN (...)` clauses for the report filters, to splice into a
 * raw SQL query (via drizzle `sql.raw`). Same approach as the enrolment-master
 * roster filter. The ids are validated positive integers (parseIdList), so
 * string interpolation here is injection-safe.
 *
 * `cols` maps each filter to the SQL column expression to compare (e.g.
 * `"pc.id"`, `"pc.affiliation_id_fk"`). Omit a key to skip that filter for a
 * report where it does not apply (e.g. class on the admission-based 12th report).
 */
export function buildReportFilterClauses(
  filters: ReportExportFilters,
  cols: {
    programCourseId?: string;
    affiliationId?: string;
    regulationTypeId?: string;
    classId?: string;
    /** SQL column expression for `students.active` (e.g. "std.active"). */
    activeId?: string;
  },
): string {
  const parts: string[] = [];
  const pc = positiveInts(filters.programCourseIds);
  if (cols.programCourseId && pc.length)
    parts.push(` AND ${cols.programCourseId} IN (${pc.join(",")})`);
  const aff = positiveInts(filters.affiliationIds);
  if (cols.affiliationId && aff.length)
    parts.push(` AND ${cols.affiliationId} IN (${aff.join(",")})`);
  const reg = positiveInts(filters.regulationTypeIds);
  if (cols.regulationTypeId && reg.length)
    parts.push(` AND ${cols.regulationTypeId} IN (${reg.join(",")})`);
  const cls = positiveInts(filters.classIds);
  if (cols.classId && cls.length)
    parts.push(` AND ${cols.classId} IN (${cls.join(",")})`);
  if (cols.activeId && typeof filters.isActive === "boolean")
    parts.push(` AND ${cols.activeId} = ${filters.isActive}`);
  return parts.join("");
}
