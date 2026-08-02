/**
 * Popular / high-demand books — top titles by circulation in the window.
 *
 * Sheet 1 sorts by raw issue count (most popular).
 * Sheet 2 sorts by Issues per copy (highest supply-vs-demand ratio — the ones
 * where you probably need to buy more copies).
 */

import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { buildStandardWorkbook } from "../report-common/build-standard-workbook.js";
import {
  BOOK_COLUMN_DEFS,
  bookContextRow,
  enrichBooksForReport,
} from "../report-common/enrich-books.js";
import {
  buildCirculationWhere,
  buildUserAndBatchJoin,
  buildUserAndBatchWhere,
  composeWhere,
} from "../report-common/user-and-batch-where.js";
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";
import { formatIntIN } from "@/utils/format-inr.js";

const TOP_LIMIT = 500;

export async function exportPopularBooksExcel(
  f: LibraryReportFilters,
): Promise<Buffer> {
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
  ];

  const query = sql`
    SELECT
      cd.book_id_fk                            AS book_id,
      COUNT(*)::int                            AS times_issued,
      COUNT(DISTINCT e.user_id_fk)::int        AS different_borrowers
    ${joins}
    ${extraJoins}
    ${composeWhere([...wheres, sql`cd.book_id_fk IS NOT NULL`])}
    GROUP BY cd.book_id_fk
    ORDER BY times_issued DESC
    LIMIT ${TOP_LIMIT}
  `;

  const raw = (await db.execute(query)).rows as Array<{
    book_id: number;
    times_issued: number;
    different_borrowers: number;
  }>;

  // Copies-per-title from copy_details (branch-scoped if a branch filter is set).
  const bookIds = raw.map((r) => r.book_id);
  const bookMap = await enrichBooksForReport(bookIds);
  const copiesRaw =
    bookIds.length === 0
      ? { rows: [] as Array<{ book_id: number; copies: number }> }
      : await db.execute(sql`
          SELECT book_id_fk AS book_id, COUNT(*)::int AS copies
          FROM copy_details
          WHERE book_id_fk IN (${sql.join(
            bookIds.map((n) => sql`${n}`),
            sql`, `,
          )})
          ${f.branchId != null ? sql` AND branch_id_fk = ${f.branchId}` : sql``}
          GROUP BY book_id_fk
        `);
  const copiesByBook = new Map<number, number>(
    (copiesRaw.rows as Array<{ book_id: number; copies: number }>).map((r) => [
      Number(r.book_id),
      Number(r.copies),
    ]),
  );

  const enriched = raw.map((r) => {
    const copies = copiesByBook.get(r.book_id) ?? 0;
    // "Average issues per copy" is rounded to a whole number per the user's
    // "no fractions" rule. Sort key uses the raw ratio so ties break stably.
    const rawRatio = copies > 0 ? r.times_issued / copies : 0;
    return {
      copies,
      timesIssued: r.times_issued,
      differentBorrowers: r.different_borrowers,
      avgIssuesPerCopy: Math.round(rawRatio),
      rawRatio,
      book: bookMap.get(r.book_id),
    };
  });

  const shapeRow = (r: (typeof enriched)[number], i: number) => ({
    "Sr No": i + 1,
    "Book title": r.book?.title ?? "",
    "Total issues in the selected date range": formatIntIN(r.timesIssued),
    "How many different students borrowed it": formatIntIN(
      r.differentBorrowers,
    ),
    "How many copies the library has": formatIntIN(r.copies),
    "Average issues per copy": formatIntIN(r.avgIssuesPerCopy),
    ...bookContextRow(r.book),
  });

  const byIssues = enriched.map(shapeRow);
  const byIssuesPerCopy = [...enriched]
    .sort((a, b) => b.rawRatio - a.rawRatio)
    .map(shapeRow);

  const totalIssues = enriched.reduce((s, r) => s + r.timesIssued, 0);
  const totalBorrowers = enriched.reduce((s, r) => s + r.differentBorrowers, 0);
  const totalCopies = enriched.reduce((s, r) => s + r.copies, 0);
  const totals = {
    "Sr No": "TOTAL",
    "Book title": "",
    "Total issues in the selected date range": formatIntIN(totalIssues),
    // Note: distinct-borrowers doesn't sum meaningfully across titles (same
    // student can borrow N different books), so this is a sum-of-per-title
    // counts (upper bound on unique borrowers). Kept for a rough magnitude.
    "How many different students borrowed it": formatIntIN(totalBorrowers),
    "How many copies the library has": formatIntIN(totalCopies),
    "Average issues per copy":
      totalCopies > 0 ? formatIntIN(Math.round(totalIssues / totalCopies)) : "",
  };

  const columns = [
    { header: "Sr No", key: "Sr No", width: 10 },
    { header: "Book title", key: "Book title", width: 50 },
    {
      header: "Total issues in the selected date range",
      key: "Total issues in the selected date range",
      width: 32,
    },
    {
      header: "How many different students borrowed it",
      key: "How many different students borrowed it",
      width: 36,
    },
    {
      header: "How many copies the library has",
      key: "How many copies the library has",
      width: 28,
    },
    {
      header: "Average issues per copy",
      key: "Average issues per copy",
      width: 24,
    },
    ...BOOK_COLUMN_DEFS.filter((c) => c.key !== "Book title"),
  ];

  const intro = [
    "How to read this sheet:",
    '"Average issues per copy" of 5 means each copy of the book was borrowed 5 times on average during the selected date range. A high number = high demand — consider buying more copies.',
    "If no date range is set in the Export filters, the totals cover ALL history.",
  ];

  return buildStandardWorkbook([
    { name: "Top by issues", columns, rows: byIssues, intro, totals },
    {
      name: "Top by issues per copy",
      columns,
      rows: byIssuesPerCopy,
      intro,
      totals,
    },
  ]);
}
