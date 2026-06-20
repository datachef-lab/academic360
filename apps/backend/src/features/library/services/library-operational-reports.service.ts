/**
 * Operational / Finance / Inventory reports for the library module.
 *
 * Each function returns a structured payload (not pre-rendered HTML/PDF) so the
 * UI can render it as a table and / or export to Excel.
 *
 * All filters are optional — `branchId` scopes by branch, `dateFrom` / `dateTo`
 * scope by the natural date column for each report (issueTimestamp for
 * circulation reports, payment.createdAt for fines-collected, etc.).
 */

import { db } from "@/db/index.js";
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNull,
  lt,
  lte,
  sql,
  SQL,
  sum,
} from "drizzle-orm";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { branchModel } from "@repo/db/schemas/models/library/branch.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { paymentModel } from "@repo/db/schemas/models/payments/payment.model.js";

export type ReportFilters = {
  branchId?: number;
  dateFrom?: Date;
  dateTo?: Date;
};

const branchCond = (b: number | undefined, col: any): SQL | undefined =>
  b == null ? undefined : eq(col, b);

const rangeCond = (
  from: Date | undefined,
  to: Date | undefined,
  col: any,
): SQL[] => {
  const c: SQL[] = [];
  if (from) c.push(gte(col, from));
  if (to) c.push(lte(col, to));
  return c;
};

const compose = (...parts: Array<SQL | undefined>): SQL | undefined => {
  const real = parts.filter((p): p is SQL => p != null);
  return real.length === 0 ? undefined : and(...real);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Overdue list — currently-issued circulations past their due date.
// ─────────────────────────────────────────────────────────────────────────────

export type OverdueRow = {
  circulationId: number;
  userId: number;
  userName: string | null;
  bookId: number | null;
  bookTitle: string;
  accessNumber: string | null;
  issuedAt: Date;
  dueAt: Date;
  daysLate: number;
  branchId: number | null;
  branchName: string | null;
};

export async function getOverdueList(
  filters: ReportFilters,
): Promise<OverdueRow[]> {
  const now = new Date();
  const where = compose(
    eq(bookCirculationModel.isReturned, false),
    lt(bookCirculationModel.returnTimestamp, now),
    branchCond(filters.branchId, bookCirculationModel.branchId),
  );
  const rows = await db
    .select({
      circulationId: bookCirculationModel.id,
      userId: bookCirculationModel.userId,
      userName: userModel.name,
      bookId: bookModel.id,
      bookTitle: bookModel.title,
      accessNumber: copyDetailsModel.accessNumber,
      issuedAt: bookCirculationModel.issueTimestamp,
      dueAt: bookCirculationModel.returnTimestamp,
      branchId: bookCirculationModel.branchId,
      branchName: branchModel.name,
    })
    .from(bookCirculationModel)
    .leftJoin(userModel, eq(userModel.id, bookCirculationModel.userId))
    .leftJoin(
      copyDetailsModel,
      eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
    )
    .leftJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
    .leftJoin(branchModel, eq(branchModel.id, bookCirculationModel.branchId))
    .where(where)
    .orderBy(bookCirculationModel.returnTimestamp);
  return rows.map((r) => ({
    ...r,
    bookTitle: r.bookTitle ?? "(unknown book)",
    daysLate: Math.max(
      0,
      Math.floor((now.getTime() - r.dueAt.getTime()) / 86400000),
    ),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Fines outstanding — bucketed by age (paymentId IS NULL means unpaid).
// ─────────────────────────────────────────────────────────────────────────────

export type FinesOutstandingBucket = {
  bucket: "0-7" | "8-30" | "31-90" | "90+";
  circulationCount: number;
  totalOutstanding: number;
};

export type FinesOutstandingRow = {
  userId: number;
  userName: string | null;
  outstanding: number;
  oldestFineDate: Date | null;
  circulationCount: number;
};

export type FinesOutstandingPayload = {
  buckets: FinesOutstandingBucket[];
  topDebtors: FinesOutstandingRow[];
};

export async function getFinesOutstanding(
  filters: ReportFilters,
): Promise<FinesOutstandingPayload> {
  const where = compose(
    isNull(bookCirculationModel.paymentId),
    sql`(${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver}) > 0`,
    branchCond(filters.branchId, bookCirculationModel.branchId),
  );
  const bucketExpr = sql<string>`
    CASE
      WHEN ${bookCirculationModel.fineDate} IS NULL THEN '0-7'
      WHEN NOW() - ${bookCirculationModel.fineDate} < INTERVAL '7 days' THEN '0-7'
      WHEN NOW() - ${bookCirculationModel.fineDate} < INTERVAL '30 days' THEN '8-30'
      WHEN NOW() - ${bookCirculationModel.fineDate} < INTERVAL '90 days' THEN '31-90'
      ELSE '90+'
    END
  `;
  // Age buckets, computed in SQL so the report stays cheap.
  const bucketRows = await db
    .select({
      bucket: bucketExpr,
      circulationCount: count(bookCirculationModel.id),
      totalOutstanding: sql<number>`COALESCE(SUM(${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver}), 0)`,
    })
    .from(bookCirculationModel)
    .where(where)
    .groupBy(bucketExpr);

  const debtorRows = await db
    .select({
      userId: bookCirculationModel.userId,
      userName: userModel.name,
      outstanding: sql<number>`COALESCE(SUM(${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver}), 0)`,
      oldestFineDate: sql<Date>`MIN(${bookCirculationModel.fineDate})`,
      circulationCount: count(bookCirculationModel.id),
    })
    .from(bookCirculationModel)
    .leftJoin(userModel, eq(userModel.id, bookCirculationModel.userId))
    .where(where)
    .groupBy(bookCirculationModel.userId, userModel.name)
    .orderBy(
      desc(
        sql`COALESCE(SUM(${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver}), 0)`,
      ),
    )
    .limit(50);

  const order: FinesOutstandingBucket["bucket"][] = [
    "0-7",
    "8-30",
    "31-90",
    "90+",
  ];
  const buckets: FinesOutstandingBucket[] = order.map((b) => {
    const row = bucketRows.find((r) => r.bucket === b);
    return {
      bucket: b,
      circulationCount: row?.circulationCount ?? 0,
      totalOutstanding: Number(row?.totalOutstanding ?? 0),
    };
  });

  return {
    buckets,
    topDebtors: debtorRows.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      outstanding: Number(r.outstanding),
      oldestFineDate: r.oldestFineDate,
      circulationCount: r.circulationCount,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Fines collected — payments with context=LIBRARY_FINE status=SUCCESS.
// ─────────────────────────────────────────────────────────────────────────────

export type FinesCollectedRow = {
  paymentId: number;
  userId: number | null;
  amount: number;
  paidAt: Date | null;
};

export type FinesCollectedPayload = {
  total: number;
  count: number;
  rows: FinesCollectedRow[];
};

export async function getFinesCollected(
  filters: ReportFilters,
): Promise<FinesCollectedPayload> {
  const where = compose(
    eq(paymentModel.context, "LIBRARY_FINE"),
    eq(paymentModel.status, "SUCCESS"),
    ...rangeCond(filters.dateFrom, filters.dateTo, paymentModel.createdAt),
  );
  const rows = await db
    .select({
      paymentId: paymentModel.id,
      userId: paymentModel.userId,
      amount: paymentModel.amount,
      paidAt: paymentModel.createdAt,
    })
    .from(paymentModel)
    .where(where)
    .orderBy(desc(paymentModel.createdAt))
    .limit(500);
  const total = rows.reduce((s, r) => s + Number(r.amount ?? 0), 0);
  return {
    total,
    count: rows.length,
    rows: rows.map((r) => ({
      paymentId: r.paymentId,
      userId: r.userId,
      amount: Number(r.amount ?? 0),
      paidAt: r.paidAt,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Stock summary — copies by status × branch.
// ─────────────────────────────────────────────────────────────────────────────

export type StockSummaryRow = {
  branchId: number | null;
  branchName: string | null;
  statusId: number | null;
  statusName: string;
  copyCount: number;
};

export async function getStockSummary(
  filters: ReportFilters,
): Promise<StockSummaryRow[]> {
  const where = compose(
    branchCond(filters.branchId, copyDetailsModel.branchId),
  );
  const rows = await db
    .select({
      branchId: copyDetailsModel.branchId,
      branchName: branchModel.name,
      statusId: copyDetailsModel.statusId,
      statusName: statusModel.name,
      copyCount: count(copyDetailsModel.id),
    })
    .from(copyDetailsModel)
    .leftJoin(statusModel, eq(statusModel.id, copyDetailsModel.statusId))
    .leftJoin(branchModel, eq(branchModel.id, copyDetailsModel.branchId))
    .where(where)
    .groupBy(
      copyDetailsModel.branchId,
      branchModel.name,
      copyDetailsModel.statusId,
      statusModel.name,
    )
    .orderBy(branchModel.name, statusModel.name);
  return rows.map((r) => ({
    branchId: r.branchId,
    branchName: r.branchName ?? "(unassigned)",
    statusId: r.statusId,
    statusName: r.statusName ?? "(unknown)",
    copyCount: r.copyCount,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. High-demand titles — top books by issue count in window.
// ─────────────────────────────────────────────────────────────────────────────

export type HighDemandRow = {
  bookId: number;
  title: string;
  isbn: string | null;
  issueCount: number;
  copiesOwned: number;
};

export async function getHighDemandTitles(
  filters: ReportFilters,
  limit: number = 25,
): Promise<HighDemandRow[]> {
  const where = compose(
    branchCond(filters.branchId, bookCirculationModel.branchId),
    ...rangeCond(
      filters.dateFrom,
      filters.dateTo,
      bookCirculationModel.issueTimestamp,
    ),
  );
  const rows = await db
    .select({
      bookId: bookModel.id,
      title: bookModel.title,
      isbn: bookModel.isbn,
      issueCount: count(bookCirculationModel.id),
    })
    .from(bookCirculationModel)
    .innerJoin(
      copyDetailsModel,
      eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
    )
    .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
    .where(where)
    .groupBy(bookModel.id, bookModel.title, bookModel.isbn)
    .orderBy(desc(count(bookCirculationModel.id)))
    .limit(limit);

  // Copies owned per title (for the demand-vs-supply ratio that the librarian
  // actually wants to see when deciding what to buy more of).
  const ids = rows.map((r) => r.bookId);
  let ownership: Map<number, number> = new Map();
  if (ids.length > 0) {
    const owned = await db
      .select({
        bookId: copyDetailsModel.bookId,
        copiesOwned: count(copyDetailsModel.id),
      })
      .from(copyDetailsModel)
      .where(
        and(
          sql`${copyDetailsModel.bookId} IN (${sql.join(
            ids.map((i) => sql`${i}`),
            sql`, `,
          )})`,
          branchCond(filters.branchId, copyDetailsModel.branchId) ?? sql`1=1`,
        ),
      )
      .groupBy(copyDetailsModel.bookId);
    ownership = new Map(owned.map((o) => [o.bookId, o.copiesOwned]));
  }
  return rows.map((r) => ({
    ...r,
    copiesOwned: ownership.get(r.bookId) ?? 0,
  }));
}
