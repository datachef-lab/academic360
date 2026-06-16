import { db } from "@/db/index.js";
import { and, count, desc, eq, gte, isNull, sql, sum } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { paymentModel } from "@repo/db/schemas/models/payments/payment.model.js";

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
};

export async function getLibraryDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

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
  ] = await Promise.all([
    db.select({ totalBooks: count() }).from(bookModel),
    db.select({ totalCopies: count() }).from(copyDetailsModel),
    db
      .select({ activeIssues: count() })
      .from(bookCirculationModel)
      .where(eq(bookCirculationModel.isReturned, false)),
    db
      .select({ overdueCount: count() })
      .from(bookCirculationModel)
      .where(
        and(
          eq(bookCirculationModel.isReturned, false),
          sql`${bookCirculationModel.returnTimestamp} < NOW()`,
        ),
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
          gte(paymentModel.createdAt, monthStart),
        ),
      ),
    db
      .select({
        finesOutstanding: sql<number>`COALESCE(SUM(${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver}), 0)`,
      })
      .from(bookCirculationModel)
      .where(isNull(bookCirculationModel.paymentId)),
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
      .where(gte(bookCirculationModel.issueTimestamp, fourteenDaysAgo))
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
      .where(gte(bookCirculationModel.issueTimestamp, fourteenDaysAgo))
      .groupBy(userModel.id, userModel.name)
      .orderBy(desc(count(bookCirculationModel.id)))
      .limit(5),
    db
      .select({
        day: sql<string>`TO_CHAR(${bookCirculationModel.issueTimestamp}, 'YYYY-MM-DD')`,
        count: count(bookCirculationModel.id),
      })
      .from(bookCirculationModel)
      .where(gte(bookCirculationModel.issueTimestamp, fourteenDaysAgo))
      .groupBy(
        sql`TO_CHAR(${bookCirculationModel.issueTimestamp}, 'YYYY-MM-DD')`,
      )
      .orderBy(
        sql`TO_CHAR(${bookCirculationModel.issueTimestamp}, 'YYYY-MM-DD')`,
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
  };
}
