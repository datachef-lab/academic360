/**
 * Wide filter set every library-report endpoint accepts. Reports pick the
 * fields they care about (footfall doesn't care about fine status, fines
 * don't care about zone) and pass the rest to `user-and-batch-where.ts` to
 * turn into drizzle `SQL[]` conditions.
 *
 * Query-param shape mirrors the platform Reports page (see
 * apps/main-console/src/features/reports/page/index.tsx `filterParams`):
 *   - single-value fields use the raw string / number
 *   - multi-select fields are passed as comma-separated ID strings
 *     (`programCourseIds=1,2,3`), which the parser splits + normalises
 *
 * Nothing here throws on bad input — invalid values fall to `undefined` so
 * the report just widens instead of 500-ing.
 */

import type { Request } from "express";

export type UserTypeFilter =
  | "ADMIN"
  | "STUDENT"
  | "FACULTY"
  | "STAFF"
  | "PARENTS";
export type CommunityFilter = "GUJARATI" | "NON-GUJARATI";
export type GenderFilter = "MALE" | "FEMALE" | "OTHER";
export type CirculationTypeFilter = "ISSUE" | "REISSUE" | "FORCED_ISSUE";
export type ReturnStatusFilter = "RETURNED" | "NOT_RETURNED";
export type FineStatusFilter = "PAID" | "OUTSTANDING" | "WAIVED";

export type LibraryReportFilters = {
  branchId?: number;
  dateFrom?: Date;
  dateTo?: Date;

  academicYearIds?: number[];

  affiliationIds?: number[];
  regulationTypeIds?: number[];
  programCourseIds?: number[];
  classIds?: number[];
  shiftIds?: number[];
  sessionIds?: number[];
  sectionIds?: number[];

  userTypes?: UserTypeFilter[];
  patronCategoryIds?: number[];
  communities?: CommunityFilter[];
  genders?: GenderFilter[];

  itemCategoryIds?: number[];
  circulationTypes?: CirculationTypeFilter[];
  returnStatus?: ReturnStatusFilter;
  fineStatus?: FineStatusFilter;

  zoneIds?: number[];
};

const optInt = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const optDate = (v: unknown): Date | undefined => {
  if (typeof v !== "string" || !v.trim()) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** Split "1,2,3" or ["1","2"] into a sanitised number[]. */
const optIntList = (v: unknown): number[] | undefined => {
  if (v == null || v === "") return undefined;
  const raw = Array.isArray(v)
    ? v.join(",")
    : typeof v === "string"
      ? v
      : String(v);
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  return ids.length > 0 ? ids : undefined;
};

const optStrList = <T extends string>(
  v: unknown,
  allowed: readonly T[],
): T[] | undefined => {
  if (v == null || v === "") return undefined;
  const raw = Array.isArray(v)
    ? v.join(",")
    : typeof v === "string"
      ? v
      : String(v);
  const set = new Set(allowed);
  const out = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is T => set.has(s as T));
  return out.length > 0 ? out : undefined;
};

const optStrOne = <T extends string>(
  v: unknown,
  allowed: readonly T[],
): T | undefined => {
  if (typeof v !== "string" || !v.trim()) return undefined;
  const up = v.trim().toUpperCase();
  return (allowed as readonly string[]).includes(up) ? (up as T) : undefined;
};

const USER_TYPES = ["ADMIN", "STUDENT", "FACULTY", "STAFF", "PARENTS"] as const;
const COMMUNITIES = ["GUJARATI", "NON-GUJARATI"] as const;
const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
const CIRCULATION_TYPES = ["ISSUE", "REISSUE", "FORCED_ISSUE"] as const;
const RETURN_STATUSES = ["RETURNED", "NOT_RETURNED"] as const;
const FINE_STATUSES = ["PAID", "OUTSTANDING", "WAIVED"] as const;

export function parseLibraryReportFilters(req: Request): LibraryReportFilters {
  const q = req.query;
  return {
    branchId: optInt(q.branchId),
    dateFrom: optDate(q.dateFrom),
    dateTo: optDate(q.dateTo),

    academicYearIds: optIntList(q.academicYearIds),

    affiliationIds: optIntList(q.affiliationIds),
    regulationTypeIds: optIntList(q.regulationTypeIds),
    programCourseIds: optIntList(q.programCourseIds),
    classIds: optIntList(q.classIds),
    shiftIds: optIntList(q.shiftIds),
    sessionIds: optIntList(q.sessionIds),
    sectionIds: optIntList(q.sectionIds),

    userTypes: optStrList(q.userTypes, USER_TYPES),
    patronCategoryIds: optIntList(q.patronCategoryIds),
    communities: optStrList(q.communities, COMMUNITIES),
    genders: optStrList(q.genders, GENDERS),

    itemCategoryIds: optIntList(q.itemCategoryIds),
    circulationTypes: optStrList(q.circulationTypes, CIRCULATION_TYPES),
    returnStatus: optStrOne(q.returnStatus, RETURN_STATUSES),
    fineStatus: optStrOne(q.fineStatus, FINE_STATUSES),

    zoneIds: optIntList(q.zoneIds),
  };
}
