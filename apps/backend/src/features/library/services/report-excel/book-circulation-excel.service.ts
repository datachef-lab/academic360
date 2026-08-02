/**
 * Book circulation report — every issued / returned / overdue / reissued /
 * forced-issue circulation event as one row. Filters from the dashboard's
 * Export filters dialog (branch, date range, batch narrowers, user attributes,
 * circulation type, return status) narrow the row set. Columns include the
 * full User + Book + Copy info blocks so the librarian doesn't have to
 * VLOOKUP anything.
 */

import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { buildStandardWorkbook } from "../report-common/build-standard-workbook.js";
import {
  BOOK_COLUMN_DEFS,
  bookContextRow,
  COPY_COLUMN_DEFS,
  copyContextRow,
  enrichBooksForReport,
  enrichCopiesForReport,
} from "../report-common/enrich-books.js";
import {
  USER_COLUMN_DEFS,
  enrichUsersForReport,
  userContextRow,
} from "../report-common/enrich-users.js";
import {
  buildCirculationWhere,
  buildUserAndBatchJoin,
  buildUserAndBatchWhere,
  composeWhere,
} from "../report-common/user-and-batch-where.js";
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";
import { formatIstDateTime } from "@/utils/format-datetime.js";
import { formatInrForExcel, formatIntIN } from "@/utils/format-inr.js";

const EXPORT_ROW_CAP = 20_000;

/** Human status string derived from the circulation flags. */
function statusFor(row: {
  isReturned: boolean;
  isReIssued: boolean;
  isForcedIssue: boolean;
  dueAt: Date | null;
  actualReturnAt: Date | null;
}): string {
  if (row.isForcedIssue) return "Forced issue";
  if (row.isReIssued) return "Reissued";
  if (row.isReturned) return "Returned";
  if (row.dueAt && row.dueAt < new Date()) return "Overdue";
  return "Issued";
}

// All timestamps render as `dd/mm/yyyy hh:mm AM/PM` in Asia/Kolkata via the
// shared helper — same output shape across every library-report export.
const fmtDT = formatIstDateTime;

export async function exportBookCirculationExcel(
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
      e.id                     AS circulation_id,
      e.user_id_fk             AS user_id,
      e.copy_details_id_fk     AS copy_id,
      COALESCE(cd.book_id_fk, 0)  AS book_id,
      e.issue_timestamp        AS issued_at,
      e.return_timestamp       AS due_at,
      e.actual_return_timestamp AS actual_return_at,
      e.is_returned            AS is_returned,
      e.is_re_issued           AS is_re_issued,
      e.is_forced_issue        AS is_forced_issue,
      COALESCE(e.fine_amount, 0) AS fine_amount,
      COALESCE(e.fine_waiver, 0) AS waiver_amount,
      e.branch_id_fk           AS branch_id,
      br.name                  AS branch_name,
      e.remarks                AS remarks
    ${joins}
    ${extraJoins}
    LEFT JOIN library_branches br ON br.id = e.branch_id_fk
    ${composeWhere(wheres)}
    ORDER BY e.issue_timestamp DESC NULLS LAST
    LIMIT ${EXPORT_ROW_CAP}
  `;

  const raw = (await db.execute(query)).rows as Array<{
    circulation_id: number;
    user_id: number;
    copy_id: number;
    book_id: number;
    issued_at: Date | null;
    due_at: Date | null;
    actual_return_at: Date | null;
    is_returned: boolean;
    is_re_issued: boolean;
    is_forced_issue: boolean;
    fine_amount: string | number;
    waiver_amount: string | number;
    branch_id: number | null;
    branch_name: string | null;
    remarks: string | null;
  }>;

  const [userMap, bookMap, copyMap] = await Promise.all([
    enrichUsersForReport(raw.map((r) => r.user_id)),
    enrichBooksForReport(
      raw.map((r) => Number(r.book_id)).filter((n) => n > 0),
    ),
    enrichCopiesForReport(raw.map((r) => r.copy_id).filter((n) => n != null)),
  ]);

  const rows = raw.map((r, i) => {
    // `db.execute(sql\`...\`)` bypasses drizzle's type coercion, so timestamp
    // columns can arrive as strings (not Date) depending on the pg driver
    // path. Coerce defensively before any .getTime() call.
    const issuedAt = r.issued_at ? new Date(r.issued_at) : null;
    const dueAt = r.due_at ? new Date(r.due_at) : null;
    const actualReturnAt = r.actual_return_at
      ? new Date(r.actual_return_at)
      : null;
    const status = statusFor({
      isReturned: r.is_returned,
      isReIssued: r.is_re_issued,
      isForcedIssue: r.is_forced_issue,
      dueAt,
      actualReturnAt,
    });
    const daysLate =
      dueAt && !r.is_returned
        ? Math.max(0, Math.floor((Date.now() - dueAt.getTime()) / 86_400_000))
        : dueAt && actualReturnAt && actualReturnAt.getTime() > dueAt.getTime()
          ? Math.floor(
              (actualReturnAt.getTime() - dueAt.getTime()) / 86_400_000,
            )
          : 0;
    return {
      "Sr No": i + 1,
      "Accession / Barcode Number":
        copyMap.get(r.copy_id)?.accessionNumber ?? "",
      "Book title": bookMap.get(Number(r.book_id))?.title ?? "",
      "Circulation status": status,
      "Issued at": fmtDT(issuedAt),
      "Due at": fmtDT(dueAt),
      "Actual return at": fmtDT(actualReturnAt),
      "Days late": daysLate,
      "Fine amount (INR)": formatInrForExcel(Number(r.fine_amount)),
      "Waiver amount (INR)": formatInrForExcel(Number(r.waiver_amount)),
      ...userContextRow(userMap.get(r.user_id)),
      ...bookContextRow(bookMap.get(Number(r.book_id))),
      ...copyContextRow(copyMap.get(r.copy_id)),
      "Circulation ID": r.circulation_id,
      Branch: r.branch_name ?? "",
      Remarks: r.remarks ?? "",
    };
  });

  return buildStandardWorkbook([
    {
      name: "Book circulation",
      columns: [
        // Rename from "Sr No" to "Sr No" — ExcelJS treats dots in column
        // keys as nested-object access when writing rows (that's the source of
        // the "eval_get_this is not a function" crash the user hit).
        { header: "Sr No", key: "Sr No", width: 10 },
        // Lead with the fields a librarian scans first: what was issued
        // (accession + title), what state it's in, and when.
        {
          header: "Accession / Barcode Number",
          key: "Accession / Barcode Number",
          width: 18,
        },
        { header: "Book title", key: "Book title", width: 34 },
        { header: "Circulation status", key: "Circulation status", width: 16 },
        { header: "Issued at", key: "Issued at", width: 20 },
        { header: "Due at", key: "Due at", width: 20 },
        { header: "Actual return at", key: "Actual return at", width: 20 },
        { header: "Days late", key: "Days late", width: 10 },
        { header: "Fine amount (INR)", key: "Fine amount (INR)", width: 16 },
        {
          header: "Waiver amount (INR)",
          key: "Waiver amount (INR)",
          width: 16,
        },
        ...USER_COLUMN_DEFS,
        // Book block minus title/accession (already up front)
        ...BOOK_COLUMN_DEFS.filter((c) => c.key !== "Book title"),
        // Copy block minus accession (already up front)
        ...COPY_COLUMN_DEFS.filter(
          (c) => c.key !== "Accession / Barcode Number",
        ),
        { header: "Circulation ID", key: "Circulation ID", width: 12 },
        { header: "Branch", key: "Branch", width: 20 },
        { header: "Remarks", key: "Remarks", width: 24 },
      ],
      rows,
      moneyKeys: ["Fine amount (INR)", "Waiver amount (INR)", "Price (INR)"],
    },
  ]);
}
