/**
 * Turns the wide LibraryReportFilters into a set of drizzle SQL conditions
 * that any circulation / footfall / fines query can AND into its WHERE clause.
 *
 * How the joins are stitched, using the pattern from
 * `library-analytics-reports.service.ts:getBatchUsage`:
 *
 *   FROM <event_table> e         (book_circulation | library_entry_exit)
 *   JOIN users u ON u.id = e.user_id_fk
 *   LEFT JOIN students s ON s.user_id_fk = u.id
 *   LEFT JOIN LATERAL (              -- promotion that covers the event, else latest
 *     SELECT p.* FROM promotions p WHERE p.student_id_fk = s.id
 *     ORDER BY (p.start_date <= <event_ts>
 *               AND (p.end_date IS NULL OR p.end_date >= <event_ts>)) DESC,
 *              p.start_date DESC NULLS LAST, p.id DESC
 *     LIMIT 1
 *   ) p ON TRUE
 *   LEFT JOIN program_courses pc ON pc.id = p.program_course_id_fk
 *
 * Reports call `buildUserAndBatchJoin(eventTable, eventTs)` for the FROM +
 * JOIN block and `buildUserAndBatchWhere(filters)` for the WHERE fragments,
 * then compose their own aggregate on top. Keeps every user/batch narrower
 * in one place so a filter change means one edit.
 */

import { sql, type SQL } from "drizzle-orm";
import type { LibraryReportFilters } from "./library-report-filters.js";

/**
 * The raw SQL FROM + JOIN chain. Uses raw table names because most of the
 * report services already drop to `db.execute(sql`...`)` for the LATERAL
 * pick — this keeps the shape uniform. `eventTs` is the sql fragment for the
 * event timestamp column (e.g. `e.issue_timestamp`).
 */
export function buildUserAndBatchJoin(
  eventTable: "book_circulation" | "library_entry_exit",
  eventTs: SQL,
): SQL {
  return sql`
    FROM ${sql.raw(eventTable)} e
    JOIN users u ON u.id = e.user_id_fk
    LEFT JOIN students s ON s.user_id_fk = u.id
    LEFT JOIN personal_details pd ON pd.user_id_fk = u.id
    LEFT JOIN LATERAL (
      SELECT pr.program_course_id_fk, pr.class_id_fk, pr.session_id_fk,
             pr.shift_id_fk, pr.section_id_fk, pr.student_id_fk
      FROM promotions pr
      WHERE pr.student_id_fk = s.id
      ORDER BY (pr.start_date <= ${eventTs}
                AND (pr.end_date IS NULL OR pr.end_date >= ${eventTs})) DESC,
               pr.start_date DESC NULLS LAST, pr.id DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN program_courses pc ON pc.id = p.program_course_id_fk
    LEFT JOIN classes cls ON cls.id = p.class_id_fk
    LEFT JOIN sessions ses ON ses.id = p.session_id_fk
    LEFT JOIN shifts sh ON sh.id = p.shift_id_fk
    LEFT JOIN sections sec ON sec.id = p.section_id_fk
    LEFT JOIN affiliations aff ON aff.id = pc.affiliation_id_fk
    LEFT JOIN regulation_types rt ON rt.id = pc.regulation_type_id_fk
  `;
}

const listCond = (col: string, ids: number[] | undefined): SQL | null => {
  if (!ids || ids.length === 0) return null;
  return sql`${sql.raw(col)} IN (${sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  )})`;
};

const strListCond = (col: string, values: string[] | undefined): SQL | null => {
  if (!values || values.length === 0) return null;
  return sql`${sql.raw(col)} IN (${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  )})`;
};

/**
 * WHERE fragments derived from user + batch + circulation narrowers. Every
 * fragment references an alias set by `buildUserAndBatchJoin` (u / s / p / pc /
 * cls / ses / sh / sec / pd / e / aff / rt), so it only makes sense when
 * composed after that FROM+JOIN block.
 */
export function buildUserAndBatchWhere(f: LibraryReportFilters): SQL[] {
  const out: SQL[] = [];

  // User attributes
  const utype = strListCond("u.type", f.userTypes);
  if (utype) out.push(utype);
  const community = strListCond("s.community", f.communities);
  if (community) out.push(community);
  const gender = strListCond("pd.gender", f.genders);
  if (gender) out.push(gender);

  // Batch attributes (via covering-window promotion)
  const pc = listCond("p.program_course_id_fk", f.programCourseIds);
  if (pc) out.push(pc);
  const cls = listCond("p.class_id_fk", f.classIds);
  if (cls) out.push(cls);
  const sh = listCond("p.shift_id_fk", f.shiftIds);
  if (sh) out.push(sh);
  const ses = listCond("p.session_id_fk", f.sessionIds);
  if (ses) out.push(ses);
  const sec = listCond("p.section_id_fk", f.sectionIds);
  if (sec) out.push(sec);
  const aff = listCond("aff.id", f.affiliationIds);
  if (aff) out.push(aff);
  const rt = listCond("rt.id", f.regulationTypeIds);
  if (rt) out.push(rt);

  // Branch on the event row
  if (f.branchId != null) out.push(sql`e.branch_id_fk = ${f.branchId}`);

  return out;
}

/**
 * WHERE fragments that only apply to `book_circulation` events (circulation
 * type, return status, item category via copy_details, fine status). Callers
 * that use LibraryEntryExit ignore these.
 */
export function buildCirculationWhere(
  f: LibraryReportFilters,
  opts: { includeCopyJoin?: boolean } = {},
): { joins: SQL; wheres: SQL[] } {
  const wheres: SQL[] = [];
  const joins = opts.includeCopyJoin
    ? sql` LEFT JOIN copy_details cd ON cd.id = e.copy_details_id_fk `
    : sql``;

  if (f.circulationTypes && f.circulationTypes.length > 0) {
    const clauses: SQL[] = [];
    if (f.circulationTypes.includes("REISSUE"))
      clauses.push(sql`e.is_re_issued = true`);
    if (f.circulationTypes.includes("FORCED_ISSUE"))
      clauses.push(sql`e.is_forced_issue = true`);
    if (f.circulationTypes.includes("ISSUE"))
      clauses.push(sql`(e.is_re_issued = false AND e.is_forced_issue = false)`);
    if (clauses.length > 0) {
      wheres.push(sql`(${sql.join(clauses, sql` OR `)})`);
    }
  }
  if (f.returnStatus === "RETURNED") wheres.push(sql`e.is_returned = true`);
  if (f.returnStatus === "NOT_RETURNED")
    wheres.push(sql`e.is_returned = false`);

  if (f.fineStatus === "PAID") wheres.push(sql`e.payment_id_fk IS NOT NULL`);
  if (f.fineStatus === "OUTSTANDING")
    wheres.push(
      sql`(e.payment_id_fk IS NULL AND (COALESCE(e.fine_amount, 0) - COALESCE(e.fine_waiver, 0)) > 0)`,
    );
  if (f.fineStatus === "WAIVED")
    wheres.push(sql`COALESCE(e.fine_waiver, 0) > 0`);

  if (
    opts.includeCopyJoin &&
    f.itemCategoryIds &&
    f.itemCategoryIds.length > 0
  ) {
    wheres.push(listCond("cd.item_category_id_fk", f.itemCategoryIds)!);
  }

  return { joins, wheres };
}

/** Compose an array of SQL fragments into a full `WHERE ...` block. */
export function composeWhere(fragments: Array<SQL | null | undefined>): SQL {
  const real = fragments.filter((f): f is SQL => f != null);
  if (real.length === 0) return sql``;
  return sql`WHERE ${sql.join(real, sql` AND `)}`;
}
