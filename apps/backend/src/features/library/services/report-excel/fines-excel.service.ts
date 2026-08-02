/**
 * Fines report — combined outstanding + collected + summary workbook.
 *
 * Sheet 1 (Outstanding): every unpaid circulation with user + book + copy +
 * fine amount + net amount owed + days overdue + fine age.
 * Sheet 2 (Collected): every SUCCESS payment in the date range.
 * Sheet 3 (Summary): totals — total outstanding, unpaid count, total
 * collected, payment count, total waived.
 */

import { db } from "@/db/index.js";
import { and, desc, eq, gte, isNull, lte, sql, type SQL } from "drizzle-orm";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { paymentModel } from "@repo/db/schemas/models/payments/payment.model.js";
import { branchModel } from "@repo/db/schemas/models/library/branch.model.js";
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
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";
import { formatIstDate, formatIstDateTime } from "@/utils/format-datetime.js";
import { formatInrForExcel } from "@/utils/format-inr.js";

const OUTSTANDING_CAP = 20_000;
const COLLECTED_CAP = 20_000;

const fmtDT = formatIstDateTime;
const fmtD = formatIstDate;

export async function exportFinesExcel(
  f: LibraryReportFilters,
): Promise<Buffer> {
  const branchCond: SQL[] =
    f.branchId != null ? [eq(bookCirculationModel.branchId, f.branchId)] : [];

  // ── Outstanding ─────────────────────────────────────────────────────────
  const outstandingConds = [
    isNull(bookCirculationModel.paymentId),
    sql`(COALESCE(${bookCirculationModel.fineAmount}, 0) - COALESCE(${bookCirculationModel.fineWaiver}, 0)) > 0`,
    ...branchCond,
  ];
  const outstandingRows = await db
    .select({
      circulationId: bookCirculationModel.id,
      userId: bookCirculationModel.userId,
      bookId: copyDetailsModel.bookId,
      copyId: bookCirculationModel.copyDetailsId,
      issuedAt: bookCirculationModel.issueTimestamp,
      dueAt: bookCirculationModel.returnTimestamp,
      fineDate: bookCirculationModel.fineDate,
      fineAmount: bookCirculationModel.fineAmount,
      waiverAmount: bookCirculationModel.fineWaiver,
    })
    .from(bookCirculationModel)
    .leftJoin(
      copyDetailsModel,
      eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
    )
    .where(and(...outstandingConds))
    .orderBy(desc(bookCirculationModel.fineAmount))
    .limit(OUTSTANDING_CAP);

  const [userMap, bookMap, copyMap] = await Promise.all([
    enrichUsersForReport(outstandingRows.map((r) => r.userId)),
    enrichBooksForReport(
      outstandingRows
        .map((r) => r.bookId)
        .filter((n): n is number => n != null),
    ),
    enrichCopiesForReport(outstandingRows.map((r) => r.copyId)),
  ]);

  const now = Date.now();
  const outstandingSheetRows = outstandingRows.map((r, i) => {
    const fine = Number(r.fineAmount ?? 0);
    const waiver = Number(r.waiverAmount ?? 0);
    const net = Math.max(0, fine - waiver);
    const daysOverdue = r.dueAt
      ? Math.max(0, Math.floor((now - r.dueAt.getTime()) / 86_400_000))
      : 0;
    const fineAgeDays = r.fineDate
      ? Math.max(0, Math.floor((now - r.fineDate.getTime()) / 86_400_000))
      : daysOverdue;
    return {
      "Sr No": i + 1,
      "Accession / Barcode Number":
        copyMap.get(r.copyId)?.accessionNumber ?? "",
      "Book title": bookMap.get(r.bookId ?? 0)?.title ?? "",
      "Net amount owed (INR)": formatInrForExcel(net),
      "Fine amount (INR)": formatInrForExcel(fine),
      "Waiver amount (INR)": formatInrForExcel(waiver),
      "Days overdue": daysOverdue,
      "Fine age (days)": fineAgeDays,
      "Issued at": fmtDT(r.issuedAt),
      "Due at": fmtDT(r.dueAt),
      ...userContextRow(userMap.get(r.userId)),
      ...bookContextRow(bookMap.get(r.bookId ?? 0)),
      ...copyContextRow(copyMap.get(r.copyId)),
      "Circulation ID": r.circulationId,
    };
  });

  // ── Collected (payments) ────────────────────────────────────────────────
  const collectedConds: SQL[] = [
    eq(paymentModel.context, "LIBRARY_FINE"),
    eq(paymentModel.status, "SUCCESS"),
  ];
  if (f.dateFrom) collectedConds.push(gte(paymentModel.createdAt, f.dateFrom));
  if (f.dateTo) collectedConds.push(lte(paymentModel.createdAt, f.dateTo));

  const collectedRows = await db
    .select({
      paymentId: paymentModel.id,
      userId: paymentModel.userId,
      amount: paymentModel.amount,
      paidAt: paymentModel.createdAt,
    })
    .from(paymentModel)
    .where(and(...collectedConds))
    .orderBy(desc(paymentModel.createdAt))
    .limit(COLLECTED_CAP);

  const collectedUsers = await enrichUsersForReport(
    collectedRows.map((r) => r.userId).filter((n): n is number => n != null),
  );

  const collectedSheetRows = collectedRows.map((r) => ({
    "Payment #": r.paymentId,
    "Amount (INR)": formatInrForExcel(Number(r.amount ?? 0)),
    "Paid at": fmtDT(r.paidAt),
    ...userContextRow(r.userId ? collectedUsers.get(r.userId) : undefined),
  }));

  // ── Summary ─────────────────────────────────────────────────────────────
  const [{ totalOutstanding, unpaidCount }] = (await db
    .select({
      totalOutstanding: sql<number>`COALESCE(SUM(${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver}), 0)`,
      unpaidCount: sql<number>`COUNT(*)::int`,
    })
    .from(bookCirculationModel)
    .where(and(...outstandingConds))) as [
    { totalOutstanding: string | number; unpaidCount: number },
  ];

  const [{ totalCollected, paymentCount }] = (await db
    .select({
      totalCollected: sql<number>`COALESCE(SUM(${paymentModel.amount}), 0)`,
      paymentCount: sql<number>`COUNT(*)::int`,
    })
    .from(paymentModel)
    .where(and(...collectedConds))) as [
    { totalCollected: string | number; paymentCount: number },
  ];

  const [{ totalWaived }] = (await db
    .select({
      totalWaived: sql<number>`COALESCE(SUM(${bookCirculationModel.fineWaiver}), 0)`,
    })
    .from(bookCirculationModel)
    .where(
      f.branchId != null
        ? eq(bookCirculationModel.branchId, f.branchId)
        : sql`TRUE`,
    )) as [{ totalWaived: string | number }];

  const summaryRows = [
    {
      Metric: "Total outstanding (INR)",
      Value: formatInrForExcel(Number(totalOutstanding ?? 0)),
    },
    {
      Metric: "Number of unpaid circulations",
      Value: Number(unpaidCount ?? 0).toLocaleString("en-IN"),
    },
    {
      Metric: "Total collected in the selected date range (INR)",
      Value: formatInrForExcel(Number(totalCollected ?? 0)),
    },
    {
      Metric: "Number of payments in the selected date range",
      Value: Number(paymentCount ?? 0).toLocaleString("en-IN"),
    },
    {
      Metric: "Total waived (INR)",
      Value: formatInrForExcel(Number(totalWaived ?? 0)),
    },
    {
      Metric: "Date range from",
      Value: f.dateFrom ? fmtD(f.dateFrom) : "(all time)",
    },
    { Metric: "Date range to", Value: f.dateTo ? fmtD(f.dateTo) : "(now)" },
  ];

  return buildStandardWorkbook([
    {
      name: "Summary",
      columns: [
        { header: "Metric", key: "Metric", width: 40 },
        { header: "Value", key: "Value", width: 28 },
      ],
      rows: summaryRows,
    },
    {
      name: "Outstanding",
      columns: [
        { header: "Sr No", key: "Sr No", width: 8 },
        {
          header: "Accession / Barcode Number",
          key: "Accession / Barcode Number",
          width: 18,
        },
        { header: "Book title", key: "Book title", width: 34 },
        {
          header: "Net amount owed (INR)",
          key: "Net amount owed (INR)",
          width: 18,
        },
        { header: "Fine amount (INR)", key: "Fine amount (INR)", width: 16 },
        {
          header: "Waiver amount (INR)",
          key: "Waiver amount (INR)",
          width: 16,
        },
        { header: "Days overdue", key: "Days overdue", width: 12 },
        { header: "Fine age (days)", key: "Fine age (days)", width: 14 },
        { header: "Issued at", key: "Issued at", width: 20 },
        { header: "Due at", key: "Due at", width: 20 },
        ...USER_COLUMN_DEFS,
        ...BOOK_COLUMN_DEFS.filter((c) => c.key !== "Book title"),
        ...COPY_COLUMN_DEFS.filter(
          (c) => c.key !== "Accession / Barcode Number",
        ),
        { header: "Circulation ID", key: "Circulation ID", width: 12 },
      ],
      rows: outstandingSheetRows,
      moneyKeys: [
        "Net amount owed (INR)",
        "Fine amount (INR)",
        "Waiver amount (INR)",
        "Price (INR)",
      ],
    },
    {
      name: "Collected",
      columns: [
        { header: "Payment #", key: "Payment #", width: 12 },
        { header: "Amount (INR)", key: "Amount (INR)", width: 14 },
        { header: "Paid at", key: "Paid at", width: 20 },
        ...USER_COLUMN_DEFS,
      ],
      rows: collectedSheetRows,
      moneyKeys: ["Amount (INR)"],
    },
  ]);
}
