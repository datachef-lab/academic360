import { db } from "@/db/index.js";
import { and, count, desc, eq, gte, isNull, lte, sql, SQL } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { libraryEntryExitModel } from "@repo/db/schemas/models/library/library-entry-exit.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { paymentModel } from "@repo/db/schemas/models/payments/payment.model.js";

export type DashboardFilters = {
  branchId?: number;
  dateFrom?: Date;
  dateTo?: Date;
};

export type DashboardStats = {
  totalBooks: number;
  totalCopies: number;
  activeIssues: number;
  overdueCount: number;
  finesCollectedThisMonth: number;
  finesOutstanding: number;
  topBooks: Array<{ bookId: number; title: string; issueCount: number }>;
  topPatrons: Array<{ userId: number; userName: string; issueCount: number }>;
  dailyIssuesLast14: Array<{ day: string; count: number }>;
  copiesByStatus: Array<{
    statusId: number | null;
    statusName: string;
    count: number;
  }>;
  entryExitByDay: Array<{ day: string; count: number }>;
};

export async function getLibraryDashboardStats(
  filters: DashboardFilters = {},
): Promise<DashboardStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const issueRangeStart = filters.dateFrom ?? fourteenDaysAgo;
  const issueRangeEnd = filters.dateTo;

  const circulationConditions = (extra?: SQL[]): SQL | undefined => {
    const c: SQL[] = [];
    if (filters.branchId != null) {
      c.push(eq(bookCirculationModel.branchId, filters.branchId));
    }
    if (extra) c.push(...extra);
    return c.length ? and(...c) : undefined;
  };

  const copyConditions = (): SQL | undefined => {
    const c: SQL[] = [];
    if (filters.branchId != null) {
      c.push(eq(copyDetailsModel.branchId, filters.branchId));
    }
    return c.length ? and(...c) : undefined;
  };

  const bookConditions = (): SQL | undefined => {
    const c: SQL[] = [];
    if (filters.branchId != null) {
      c.push(eq(bookModel.branchId, filters.branchId));
    }
    return c.length ? and(...c) : undefined;
  };

  const entryExitConditions = (): SQL | undefined => {
    const c: SQL[] = [];
    if (filters.branchId != null) {
      c.push(eq(libraryEntryExitModel.branchId, filters.branchId));
    }
    if (filters.dateFrom) {
      c.push(gte(libraryEntryExitModel.entryTimestamp, filters.dateFrom));
    }
    if (filters.dateTo) {
      c.push(lte(libraryEntryExitModel.entryTimestamp, filters.dateTo));
    }
    return c.length ? and(...c) : undefined;
  };

  const issueRange: SQL[] = [
    gte(bookCirculationModel.issueTimestamp, issueRangeStart),
  ];
  if (issueRangeEnd) {
    issueRange.push(lte(bookCirculationModel.issueTimestamp, issueRangeEnd));
  }

  const [
    [{ totalBooks }],
    [{ totalCopies }],
    [{ activeIssues }],
    [{ overdueCount }],
    [{ finesCollectedThisMonth }],
    [{ finesOutstanding }],
    topBooksRaw,
    topPatronsRaw,
    dailyIssuesRaw,
    copiesByStatusRaw,
    entryExitByDayRaw,
  ] = await Promise.all([
    db.select({ totalBooks: count() }).from(bookModel).where(bookConditions()),
    db
      .select({ totalCopies: count() })
      .from(copyDetailsModel)
      .where(copyConditions()),
    db
      .select({ activeIssues: count() })
      .from(bookCirculationModel)
      .where(
        circulationConditions([eq(bookCirculationModel.isReturned, false)]),
      ),
    db
      .select({ overdueCount: count() })
      .from(bookCirculationModel)
      .where(
        circulationConditions([
          eq(bookCirculationModel.isReturned, false),
          sql`${bookCirculationModel.returnTimestamp} < NOW()`,
        ]),
      ),
    db
      .select({
        finesCollectedThisMonth: sql<number>`COALESCE(SUM(${paymentModel.amount}), 0)`,
      })
      .from(paymentModel)
      .where(
        and(
          eq(paymentModel.context, "LIBRARY_FINE"),
          eq(paymentModel.status, "SUCCESS"),
          gte(paymentModel.createdAt, filters.dateFrom ?? monthStart),
          ...(filters.dateTo
            ? [lte(paymentModel.createdAt, filters.dateTo)]
            : []),
        ),
      ),
    db
      .select({
        finesOutstanding: sql<number>`COALESCE(SUM(${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver}), 0)`,
      })
      .from(bookCirculationModel)
      .where(circulationConditions([isNull(bookCirculationModel.paymentId)])),
    db
      .select({
        bookId: bookModel.id,
        title: bookModel.title,
        issueCount: count(bookCirculationModel.id),
      })
      .from(bookCirculationModel)
      .innerJoin(
        copyDetailsModel,
        eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
      )
      .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
      .where(circulationConditions(issueRange))
      .groupBy(bookModel.id, bookModel.title)
      .orderBy(desc(count(bookCirculationModel.id)))
      .limit(5),
    db
      .select({
        userId: userModel.id,
        userName: userModel.name,
        issueCount: count(bookCirculationModel.id),
      })
      .from(bookCirculationModel)
      .innerJoin(userModel, eq(userModel.id, bookCirculationModel.userId))
      .where(circulationConditions(issueRange))
      .groupBy(userModel.id, userModel.name)
      .orderBy(desc(count(bookCirculationModel.id)))
      .limit(5),
    db
      .select({
        day: sql<string>`TO_CHAR(${bookCirculationModel.issueTimestamp}, 'YYYY-MM-DD')`,
        count: count(bookCirculationModel.id),
      })
      .from(bookCirculationModel)
      .where(circulationConditions(issueRange))
      .groupBy(
        sql`TO_CHAR(${bookCirculationModel.issueTimestamp}, 'YYYY-MM-DD')`,
      )
      .orderBy(
        sql`TO_CHAR(${bookCirculationModel.issueTimestamp}, 'YYYY-MM-DD')`,
      ),
    db
      .select({
        statusId: copyDetailsModel.statusId,
        statusName: statusModel.name,
        count: count(copyDetailsModel.id),
      })
      .from(copyDetailsModel)
      .leftJoin(statusModel, eq(statusModel.id, copyDetailsModel.statusId))
      .where(copyConditions())
      .groupBy(copyDetailsModel.statusId, statusModel.name)
      .orderBy(desc(count(copyDetailsModel.id))),
    db
      .select({
        day: sql<string>`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
        count: count(libraryEntryExitModel.id),
      })
      .from(libraryEntryExitModel)
      .where(entryExitConditions())
      .groupBy(
        sql`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
      )
      .orderBy(
        sql`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
      ),
  ]);

  return {
    totalBooks: totalBooks ?? 0,
    totalCopies: totalCopies ?? 0,
    activeIssues: activeIssues ?? 0,
    overdueCount: overdueCount ?? 0,
    finesCollectedThisMonth: Number(finesCollectedThisMonth ?? 0),
    finesOutstanding: Number(finesOutstanding ?? 0),
    topBooks: topBooksRaw.map((r) => ({
      bookId: r.bookId,
      title: r.title,
      issueCount: r.issueCount,
    })),
    topPatrons: topPatronsRaw.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      issueCount: r.issueCount,
    })),
    dailyIssuesLast14: dailyIssuesRaw.map((r) => ({
      day: r.day,
      count: r.count,
    })),
    copiesByStatus: copiesByStatusRaw.map((r) => ({
      statusId: r.statusId,
      statusName: r.statusName ?? "Unknown",
      count: r.count,
    })),
    entryExitByDay: entryExitByDayRaw.map((r) => ({
      day: r.day,
      count: r.count,
    })),
  };
}
