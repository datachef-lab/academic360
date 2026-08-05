/**
 * Publications usage — three sheets (Publisher / Journal / Series). Each row
 * shows titles / issues in window / different students who borrowed / first
 * and last issue dates in the window. Journal sheet adds ISSN + active
 * subscription info.
 */

import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import {
  buildStandardWorkbook,
  type WorkbookSheet,
} from "../report-common/build-standard-workbook.js";
import {
  buildCirculationWhere,
  buildUserAndBatchJoin,
  buildUserAndBatchWhere,
  composeWhere,
} from "../report-common/user-and-batch-where.js";
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";
import { formatIstDate } from "@/utils/format-datetime.js";
import { formatIntIN } from "@/utils/format-inr.js";

type Dim = "publisher" | "journal" | "series";

type Row = {
  id: number;
  name: string;
  titles: number;
  issues: number;
  differentBorrowers: number;
  firstIssue: Date | null;
  lastIssue: Date | null;
  // Journal extras (filled for dim=journal only)
  issn?: string | null;
  publisher?: string | null;
  language?: string | null;
  activeSubscriptions?: number;
  nextSubscriptionEnd?: Date | null;
};

async function pullDim(dim: Dim, f: LibraryReportFilters): Promise<Row[]> {
  const eventTs = sql`e.issue_timestamp`;
  const joins = buildUserAndBatchJoin("book_circulation", eventTs);
  const { joins: extraJoins, wheres: circWheres } = buildCirculationWhere(f, {
    includeCopyJoin: true,
  });
  const wheres = [
    ...buildUserAndBatchWhere(f),
    ...circWheres,
    f.dateFrom ? sql`e.issue_timestamp >= ${f.dateFrom}` : null,
    f.dateTo ? sql`e.issue_timestamp <= ${f.dateTo}` : null,
    sql`cd.book_id_fk IS NOT NULL`,
  ];

  const bookFkCol =
    dim === "publisher"
      ? sql`b.publisher_id_fk`
      : dim === "journal"
        ? sql`b.journal_id_fk`
        : sql`b.series_id_fk`;
  const nameCol =
    dim === "publisher"
      ? sql`pub.name`
      : dim === "journal"
        ? sql`j.title`
        : sql`sr.name`;
  const nameJoin =
    dim === "publisher"
      ? sql`LEFT JOIN publishers pub ON pub.id = b.publisher_id_fk`
      : dim === "journal"
        ? sql`LEFT JOIN journals j ON j.id = b.journal_id_fk`
        : sql`LEFT JOIN series sr ON sr.id = b.series_id_fk`;

  const rowsRaw = (
    await db.execute(sql`
      SELECT
        ${bookFkCol}                             AS id,
        ${nameCol}                               AS name,
        COUNT(DISTINCT b.id)::int                AS titles,
        COUNT(*)::int                            AS issues,
        COUNT(DISTINCT e.user_id_fk)::int        AS different_borrowers,
        MIN(e.issue_timestamp)                   AS first_issue,
        MAX(e.issue_timestamp)                   AS last_issue
      ${joins}
      ${extraJoins}
      INNER JOIN books b ON b.id = cd.book_id_fk
      ${nameJoin}
      ${composeWhere([...wheres, sql`${bookFkCol} IS NOT NULL`])}
      GROUP BY ${bookFkCol}, ${nameCol}
      ORDER BY issues DESC
      LIMIT 500
    `)
  ).rows as Array<{
    id: number;
    name: string;
    titles: number;
    issues: number;
    different_borrowers: number;
    first_issue: Date | null;
    last_issue: Date | null;
  }>;

  const base: Row[] = rowsRaw.map((r) => ({
    id: Number(r.id),
    name: r.name ?? "",
    titles: Number(r.titles),
    issues: Number(r.issues),
    differentBorrowers: Number(r.different_borrowers),
    firstIssue: r.first_issue,
    lastIssue: r.last_issue,
  }));

  if (dim !== "journal" || base.length === 0) return base;

  const ids = base.map((r) => r.id);
  const journalExtras = (
    await db.execute(sql`
      SELECT j.id, j.issn_number, pub.name AS publisher_name, lm.name AS language_name
      FROM journals j
      LEFT JOIN publishers pub ON pub.id = j.publisher_id_fk
      LEFT JOIN language_medium lm ON lm.id = j.language_id_fk
      WHERE j.id IN (${sql.join(
        ids.map((n) => sql`${n}`),
        sql`, `,
      )})
    `)
  ).rows as Array<{
    id: number;
    issn_number: string | null;
    publisher_name: string | null;
    language_name: string | null;
  }>;
  const jExtraById = new Map(journalExtras.map((r) => [Number(r.id), r]));

  const subs = (
    await db.execute(sql`
      SELECT journal_id_fk AS journal_id,
             COUNT(*)::int AS active_count,
             MIN(end_date) AS next_end
      FROM library_journal_subscriptions
      WHERE end_date >= CURRENT_DATE
        AND journal_id_fk IN (${sql.join(
          ids.map((n) => sql`${n}`),
          sql`, `,
        )})
      GROUP BY journal_id_fk
    `)
  ).rows as Array<{
    journal_id: number;
    active_count: number;
    next_end: Date | null;
  }>;
  const subsById = new Map(subs.map((r) => [Number(r.journal_id), r]));

  return base.map((r) => {
    const extra = jExtraById.get(r.id);
    const sub = subsById.get(r.id);
    return {
      ...r,
      issn: extra?.issn_number ?? null,
      publisher: extra?.publisher_name ?? null,
      language: extra?.language_name ?? null,
      activeSubscriptions: sub?.active_count ?? 0,
      nextSubscriptionEnd: sub?.next_end ?? null,
    };
  });
}

// First column renamed per dimension so the sheet is unambiguous — a librarian
// reading "Publisher name" vs "Journal title" vs "Series name" knows exactly
// what they're looking at without having to check the sheet tab.
const nameHeaderFor = (dim: Dim): string =>
  dim === "publisher"
    ? "Publisher name"
    : dim === "journal"
      ? "Journal title"
      : "Series name";

function toSheet(name: string, dim: Dim, rows: Row[]): WorkbookSheet {
  const nameHeader = nameHeaderFor(dim);
  const dimNoun =
    dim === "publisher"
      ? "publisher"
      : dim === "journal"
        ? "journal"
        : "series";
  const baseColumns = [
    { header: "Sr No", key: "Sr No", width: 10 },
    { header: nameHeader, key: nameHeader, width: 40 },
    {
      header: "Total issues in the selected date range",
      key: "Total issues in the selected date range",
      width: 32,
    },
    {
      header: `How many different students borrowed from this ${dimNoun}`,
      key: `How many different students borrowed from this ${dimNoun}`,
      width: 38,
    },
    {
      header: "How many books / titles are linked",
      key: "How many books / titles are linked",
      width: 28,
    },
    {
      header: "First issue in the selected date range",
      key: "First issue in the selected date range",
      width: 28,
    },
    {
      header: "Last issue in the selected date range",
      key: "Last issue in the selected date range",
      width: 28,
    },
  ];
  const journalCols =
    dim === "journal"
      ? [
          { header: "ISSN", key: "ISSN", width: 20 },
          { header: "Journal publisher", key: "Journal publisher", width: 28 },
          { header: "Language", key: "Language", width: 18 },
          {
            header: "Active subscriptions",
            key: "Active subscriptions",
            width: 22,
          },
          {
            header: "Next subscription end date",
            key: "Next subscription end date",
            width: 26,
          },
        ]
      : [];

  return {
    name,
    columns: [...baseColumns, ...journalCols],
    rows: rows.map((r, i) => ({
      "Sr No": i + 1,
      [nameHeader]: r.name,
      "Total issues in the selected date range": formatIntIN(r.issues),
      [`How many different students borrowed from this ${dimNoun}`]:
        formatIntIN(r.differentBorrowers),
      "How many books / titles are linked": formatIntIN(r.titles),
      "First issue in the selected date range": formatIstDate(r.firstIssue),
      "Last issue in the selected date range": formatIstDate(r.lastIssue),
      ...(dim === "journal"
        ? {
            ISSN: r.issn ?? "",
            "Journal publisher": r.publisher ?? "",
            Language: r.language ?? "",
            "Active subscriptions": formatIntIN(r.activeSubscriptions ?? 0),
            "Next subscription end date": formatIstDate(
              r.nextSubscriptionEnd ?? null,
            ),
          }
        : {}),
    })),
  };
}

export async function exportPublicationsExcel(
  f: LibraryReportFilters,
): Promise<Buffer> {
  const [pub, jrn, ser] = await Promise.all([
    pullDim("publisher", f),
    pullDim("journal", f),
    pullDim("series", f),
  ]);
  return buildStandardWorkbook([
    toSheet("By publisher", "publisher", pub),
    toSheet("By journal", "journal", jrn),
    toSheet("By series", "series", ser),
  ]);
}
