import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { db } from "@/db/index.js";
import { getCachedSnapshot } from "@/services/snapshot-cache.js";

export type IdCardDashboardFilters = {
  academicYearIds?: number[];
  programCourseIds?: number[];
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
};

type NameValue = { name: string; value: number };
type DayCount = { date: string; count: number };
type HourCount = { hour: number; count: number };
type RecentIssue = {
  id: number;
  studentName: string | null;
  uid: string | null;
  course: string | null;
  rfidNumber: string | null;
  issueStatus: string;
  issuedBy: string | null;
  issuedAt: string | null;
};

export type IdCardDashboardStats = {
  kpis: {
    totalIssued: number;
    issuedToday: number;
    draftsPending: number;
    printedNotSaved: number;
    legacyCount: number;
    newCount: number;
    studentsWithCard: number;
  };
  byStatus: NameValue[];
  perDay: DayCount[];
  byHour: HourCount[];
  byProgramCourse: NameValue[];
  byAcademicYear: NameValue[];
  byTemplate: NameValue[];
  topOperators: NameValue[];
  recent: RecentIssue[];
  templates: { total: number; active: number; disabled: number };
};

const IDCARD_DASHBOARD_TTL_SEC = 60;

/** Deterministic cache key: sorted arrays so equivalent filter sets share one entry. */
function stableIdCardDashboardKey(f: IdCardDashboardFilters): string {
  const sortNums = (a?: number[]) => [...(a ?? [])].sort((x, y) => x - y);
  return JSON.stringify({
    ay: sortNums(f.academicYearIds),
    pc: sortNums(f.programCourseIds),
    from: f.from ?? null,
    to: f.to ?? null,
  });
}

/** WHERE fragments shared by the whole aggregation (over `i` + `lp`). */
function buildConditions(f: IdCardDashboardFilters): SQL {
  const conds: SQL[] = [];
  if (f.from && f.to)
    conds.push(
      sql`i.issue_date::date BETWEEN ${f.from}::date AND ${f.to}::date`,
    );
  else if (f.from) conds.push(sql`i.issue_date::date >= ${f.from}::date`);
  else if (f.to) conds.push(sql`i.issue_date::date <= ${f.to}::date`);
  if (f.academicYearIds?.length)
    conds.push(sql`lp.academic_year_id = ANY(${f.academicYearIds})`);
  if (f.programCourseIds?.length)
    conds.push(sql`lp.program_course_id = ANY(${f.programCourseIds})`);
  return conds.length ? sql`WHERE ${sql.join(conds, sql` AND `)}` : sql``;
}

/**
 * Realtime ID-card dashboard aggregates. One mega-query shares the (heavy)
 * "each student's latest promotion" dimension CTE across every widget so the
 * whole-table join is done once; a second tiny query covers the templates
 * master. Every count respects the date / academic-year / program-course
 * filters. DRAFT rows are counted only where a draft is meaningful (drafts
 * pending, printed-not-saved); every other metric is over finalized issues.
 */
export async function getIdCardDashboardStats(
  f: IdCardDashboardFilters,
): Promise<IdCardDashboardStats> {
  const where = buildConditions(f);

  const [aggResult, tplResult] = await Promise.all([
    db.execute(sql`
      WITH latest_promo AS (
        SELECT DISTINCT ON (p.student_id_fk)
               p.student_id_fk           AS student_id,
               se.academic_id_fk         AS academic_year_id,
               ay.year                   AS academic_year,
               p.program_course_id_fk    AS program_course_id,
               COALESCE(pc.short_name, pc.name) AS program_course
        FROM promotions p
        LEFT JOIN sessions se ON se.id = p.session_id_fk
        LEFT JOIN academic_years ay ON ay.id = se.academic_id_fk
        LEFT JOIN program_courses pc ON pc.id = p.program_course_id_fk
        ORDER BY p.student_id_fk, p.id DESC
      ),
      iss AS (
        SELECT i.id, i.issue_status, i.issue_date, i.template_id_fk,
               i.legacy_issue_id, i.issued_by_user_id_fk, i.printed_at,
               i.saved_at, i.student_id_fk, i.rfid_number, i.name_snapshot,
               i.course_snapshot,
               lp.academic_year_id, lp.academic_year,
               lp.program_course_id, lp.program_course
        FROM id_card_issues i
        LEFT JOIN latest_promo lp ON lp.student_id = i.student_id_fk
        ${where}
      ),
      kpis AS (
        SELECT json_build_object(
          'totalIssued',     count(*) FILTER (WHERE issue_status <> 'DRAFT'),
          'issuedToday',     count(*) FILTER (WHERE issue_status <> 'DRAFT' AND issue_date::date = CURRENT_DATE),
          'draftsPending',   count(*) FILTER (WHERE issue_status = 'DRAFT'),
          'printedNotSaved', count(*) FILTER (WHERE printed_at IS NOT NULL AND saved_at IS NULL),
          'legacyCount',     count(*) FILTER (WHERE issue_status <> 'DRAFT' AND legacy_issue_id IS NOT NULL),
          'newCount',        count(*) FILTER (WHERE issue_status <> 'DRAFT' AND legacy_issue_id IS NULL),
          'studentsWithCard',count(DISTINCT student_id_fk) FILTER (WHERE issue_status <> 'DRAFT')
        ) AS data
        FROM iss
      ),
      by_status AS (
        SELECT COALESCE(json_agg(json_build_object('name', issue_status, 'value', c) ORDER BY c DESC), '[]'::json) AS data
        FROM (SELECT issue_status, count(*) c FROM iss GROUP BY issue_status) t
      ),
      per_day AS (
        SELECT COALESCE(json_agg(json_build_object('date', to_char(d, 'YYYY-MM-DD'), 'count', c) ORDER BY d), '[]'::json) AS data
        FROM (
          SELECT issue_date::date AS d, count(*) c
          FROM iss
          WHERE issue_status <> 'DRAFT' AND issue_date >= (CURRENT_DATE - INTERVAL '29 days')
          GROUP BY issue_date::date
        ) t
      ),
      by_hour AS (
        SELECT COALESCE(json_agg(json_build_object('hour', gs.h, 'count', COALESCE(c.cnt, 0)) ORDER BY gs.h), '[]'::json) AS data
        FROM generate_series(0, 23) gs(h)
        LEFT JOIN (
          -- Legacy-imported cards store issue_date in UTC, but new cards store
          -- IST wall-clock (the pool session tz). This is the only chart that
          -- aggregates across all history (per_day/today only hold new rows),
          -- so shift legacy rows +5:30 to IST — otherwise their afternoon
          -- issuances land in an impossible 2-7am bucket.
          SELECT EXTRACT(HOUR FROM
                   CASE WHEN legacy_issue_id IS NOT NULL
                        THEN issue_date + INTERVAL '5 hours 30 minutes'
                        ELSE issue_date END
                 )::int AS hh, count(*) cnt
          FROM iss WHERE issue_status <> 'DRAFT'
          GROUP BY 1
        ) c ON c.hh = gs.h
      ),
      by_course AS (
        SELECT COALESCE(json_agg(json_build_object('name', name, 'value', c) ORDER BY c DESC), '[]'::json) AS data
        FROM (
          SELECT COALESCE(program_course, '—') AS name, count(*) c
          FROM iss WHERE issue_status <> 'DRAFT'
          GROUP BY program_course ORDER BY c DESC LIMIT 12
        ) t
      ),
      by_year AS (
        SELECT COALESCE(json_agg(json_build_object('name', name, 'value', c) ORDER BY c DESC), '[]'::json) AS data
        FROM (
          SELECT COALESCE(academic_year, '—') AS name, count(*) c
          FROM iss WHERE issue_status <> 'DRAFT'
          GROUP BY academic_year ORDER BY c DESC LIMIT 12
        ) t
      ),
      by_template AS (
        SELECT COALESCE(json_agg(json_build_object('name', name, 'value', c) ORDER BY c DESC), '[]'::json) AS data
        FROM (
          SELECT COALESCE(t.name, '—') AS name, count(*) c
          FROM iss i2
          LEFT JOIN id_card_templates t ON t.id = i2.template_id_fk
          WHERE i2.issue_status <> 'DRAFT'
          GROUP BY t.name ORDER BY c DESC LIMIT 12
        ) x
      ),
      top_ops AS (
        SELECT COALESCE(json_agg(json_build_object('name', name, 'value', c) ORDER BY c DESC), '[]'::json) AS data
        FROM (
          SELECT COALESCE(u.name, '—') AS name, count(*) c
          FROM iss i2
          LEFT JOIN users u ON u.id = i2.issued_by_user_id_fk
          WHERE i2.issue_status <> 'DRAFT' AND i2.issued_by_user_id_fk IS NOT NULL
          GROUP BY u.name ORDER BY c DESC LIMIT 8
        ) x
      ),
      recent AS (
        SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.sort_date DESC), '[]'::json) AS data
        FROM (
          SELECT i2.id,
                 COALESCE(i2.name_snapshot, u.name) AS "studentName",
                 s.uid AS uid,
                 i2.course_snapshot AS course,
                 i2.rfid_number AS "rfidNumber",
                 i2.issue_status AS "issueStatus",
                 ub.name AS "issuedBy",
                 to_char(i2.issue_date, 'DD/MM/YYYY, HH12:MI AM') AS "issuedAt",
                 i2.issue_date AS sort_date
          FROM iss i2
          LEFT JOIN students s ON s.id = i2.student_id_fk
          LEFT JOIN users u ON u.id = s.user_id_fk
          LEFT JOIN users ub ON ub.id = i2.issued_by_user_id_fk
          WHERE i2.issue_status <> 'DRAFT'
          ORDER BY i2.issue_date DESC
          LIMIT 10
        ) r
      )
      SELECT
        (SELECT data FROM kpis)       AS kpis,
        (SELECT data FROM by_status)  AS by_status,
        (SELECT data FROM per_day)    AS per_day,
        (SELECT data FROM by_hour)    AS by_hour,
        (SELECT data FROM by_course)  AS by_course,
        (SELECT data FROM by_year)    AS by_year,
        (SELECT data FROM by_template) AS by_template,
        (SELECT data FROM top_ops)    AS top_ops,
        (SELECT data FROM recent)     AS recent
    `),
    db.execute(sql`
      SELECT
        count(*)::int                                   AS total,
        count(*) FILTER (WHERE disabled IS NOT TRUE)::int AS active,
        count(*) FILTER (WHERE disabled IS TRUE)::int     AS disabled
      FROM id_card_templates
      ${
        f.academicYearIds?.length
          ? sql`WHERE academic_year_id_fk = ANY(${f.academicYearIds})`
          : sql``
      }
    `),
  ]);

  const a = (aggResult.rows[0] ?? {}) as Record<string, unknown>;
  const tpl = (tplResult.rows[0] ?? {}) as {
    total?: number;
    active?: number;
    disabled?: number;
  };

  const kpis = (a.kpis ?? {}) as IdCardDashboardStats["kpis"];

  return {
    kpis: {
      totalIssued: Number(kpis.totalIssued ?? 0),
      issuedToday: Number(kpis.issuedToday ?? 0),
      draftsPending: Number(kpis.draftsPending ?? 0),
      printedNotSaved: Number(kpis.printedNotSaved ?? 0),
      legacyCount: Number(kpis.legacyCount ?? 0),
      newCount: Number(kpis.newCount ?? 0),
      studentsWithCard: Number(kpis.studentsWithCard ?? 0),
    },
    byStatus: (a.by_status as NameValue[]) ?? [],
    perDay: (a.per_day as DayCount[]) ?? [],
    byHour: (a.by_hour as HourCount[]) ?? [],
    byProgramCourse: (a.by_course as NameValue[]) ?? [],
    byAcademicYear: (a.by_year as NameValue[]) ?? [],
    byTemplate: (a.by_template as NameValue[]) ?? [],
    topOperators: (a.top_ops as NameValue[]) ?? [],
    recent: (a.recent as RecentIssue[]) ?? [],
    templates: {
      total: Number(tpl.total ?? 0),
      active: Number(tpl.active ?? 0),
      disabled: Number(tpl.disabled ?? 0),
    },
  };
}

/** Redis epoch-cached entry point (mirrors library/fees dashboards). */
export function getIdCardDashboardStatsCached(
  f: IdCardDashboardFilters,
): Promise<IdCardDashboardStats> {
  return getCachedSnapshot(
    "idcard:dashboard",
    stableIdCardDashboardKey(f),
    IDCARD_DASHBOARD_TTL_SEC,
    () => getIdCardDashboardStats(f),
  );
}
