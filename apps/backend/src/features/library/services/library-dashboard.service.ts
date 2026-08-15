import { db } from "@/db/index.js";
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lte,
  sql,
  SQL,
} from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { libraryEntryExitModel } from "@repo/db/schemas/models/library/library-entry-exit.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { staffModel } from "@repo/db/schemas/models/user/staff.model.js";
import { paymentModel } from "@repo/db/schemas/models/payments/payment.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { rackModel } from "@repo/db/schemas/models/library/rack.model.js";
import { libraryDocumentTypeModel } from "@repo/db/schemas/models/library/library-document-type.model.js";
import { languageMediumModel } from "@repo/db/schemas/models/resources/languageMedium.model.js";
// student → patron category is not modelled yet, so entries-by-patron-category
// falls back to grouping by users.type (STUDENT / STAFF / TEACHER). Swap the
// group to `library_patron_categories` once student.patronCategoryId lands.
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";
import { seriesModel } from "@repo/db/schemas/models/library/series.model.js";
import { holidayModel } from "@repo/db/schemas/models/library/holiday.model.js";

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
  /** Per-day circulation events; `count` = issues + reissues (total).
   *  `returns` is keyed by the actual-return day, merged onto the same
   *  day axis so the chart can overlay all three lines. */
  dailyIssuesLast14: Array<{
    day: string;
    issues: number;
    reissues: number;
    returns: number;
    count: number;
  }>;
  copiesByStatus: Array<{
    statusId: number | null;
    statusName: string;
    count: number;
  }>;
  entryExitByDay: Array<{ day: string; count: number }>;
  /** Same series split by user type — one chart line per patron type. */
  entryExitByDayByCategory: Array<{
    day: string;
    category: string;
    count: number;
  }>;

  // Article-entry / catalogue counts — for the Holdings tiles.
  totalJournals: number;
  totalSeries: number;
  totalHolidays: number;

  // Circulation tab — everything reads from book_circulation.
  currentlyInLibrary: number; // library_entry_exit rows still CHECKED_IN
  reissueCount: number; // isReIssued = true, within the selected date range
  /** All-time renewed-loan count — context for the range-scoped tile. */
  reissueCountAllTime: number;
  forcedIssueCount: number; // isForcedIssue = true
  finesWaivedThisMonth: number; // fine_waiver > 0 with fineWaivedAt in month
  avgLoanDays: number; // AVG(actualReturn - issue) over returned rows
  overdueAgeing: Array<{ bucket: "0-7" | "8-30" | ">30"; count: number }>;
  /** Open overdue loans grouped by borrower, worst first (top 10, "now"-scoped).
   *  `uid` is the human-facing student identifier (null for staff). */
  overdueByPatron: Array<{
    userId: number;
    userName: string | null;
    uid: string | null;
    category: string;
    count: number;
  }>;
  /** Longest-overdue open loans, oldest due date first (top 10). */
  longestOverdue: Array<{
    circulationId: number;
    title: string;
    userName: string | null;
    uid: string | null;
    category: string;
    dueDate: string;
    daysOverdue: number;
  }>;
  /** Currently open loans split by user type. */
  openLoansByCategory: Array<{ category: string; count: number }>;

  // Holdings tab — where copies live and what the catalogue looks like.
  booksByLanguage: Array<{ language: string; count: number }>;
  booksByPublisher: Array<{ publisher: string; count: number }>; // top 10
  booksByDocumentType: Array<{ documentType: string; count: number }>;
  copiesByRack: Array<{ rack: string; count: number }>; // top 10 by copy count
  booksAddedPerYear: Array<{ year: string; count: number }>;
  /** DISTINCT publisher count across all books (not the top-10 shown). */
  totalPublishers: number;
  /** DISTINCT language count across all books. */
  totalLanguages: number;

  // Footfall tab — visits, not attendance.
  entriesByHourOfDay: Array<{ hour: number; count: number }>;
  /** Exits by hour of day — the mirror of entriesByHourOfDay. Overlaying the
   *  two lets an operator see when the library empties out relative to when
   *  it fills up. */
  exitsByHourOfDay: Array<{ hour: number; count: number }>;
  entriesByPatronCategory: Array<{ category: string; count: number }>;
  avgVisitMinutes: number; // over rows with both timestamps set

  // Fines tab — currency amounts, not counts of rupees.
  finesByDay: Array<{ day: string; collected: number; waived: number }>;
  outstandingByPatron: Array<{
    userId: number;
    userName: string | null;
    amount: number;
  }>; // top 10
};

/** users.type → library patron category, same mapping as the policy
 *  resolver (ADMIN counts as STAFF, PARENTS borrow as STUDENT). */
const PATRON_BY_USER_TYPE: Record<string, string> = {
  STUDENT: "STUDENT",
  FACULTY: "FACULTY",
  TEACHER: "FACULTY",
  STAFF: "STAFF",
  ADMIN: "STAFF",
  PARENTS: "STUDENT",
};
const patronOf = (t: string): string => PATRON_BY_USER_TYPE[t] ?? t;

/**
 * Midnight today in Asia/Kolkata, as a UTC Date. IST is a fixed UTC+5:30
 * (no DST), so plain offset arithmetic is safe.
 */
function istTodayStart(): Date {
  const IST_OFFSET_MS = 5.5 * 3_600_000;
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  return new Date(
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate(),
    ) - IST_OFFSET_MS,
  );
}

export async function getLibraryDashboardStats(
  filters: DashboardFilters = {},
): Promise<DashboardStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Honour the user's filter: only fall back to the 14-day window when the
  // user explicitly picked the "14 days" preset. On "all time" (dateFrom is
  // undefined AND the caller marks that as intentional) the query MUST run
  // unfiltered — otherwise a freshly-imported library shows an empty daily
  // chart forever because every issue is older than 14 days. Behaviour we
  // want: dateFrom set → use it; dateFrom absent → no lower bound.
  const issueRangeStart = filters.dateFrom;
  const issueRangeEnd = filters.dateTo;
  // Keep the const so an unused-variable lint doesn't fire on 14-day; the
  // symbol may return when we wire an explicit "last 14 days" widget again.
  void fourteenDaysAgo;

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

  const issueRange: SQL[] = [];
  if (issueRangeStart) {
    issueRange.push(gte(bookCirculationModel.issueTimestamp, issueRangeStart));
  }
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
    dailyReturnsRaw,
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
      // "Top 5" isn't a range chart — a 14-day filter meant a freshly-
      // imported library (all IRP data is historical) showed nothing at all.
      // Filter by branch only; the ranking is all-time.
      .where(circulationConditions())
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
      // All-time, same reason as top books.
      .where(circulationConditions())
      .groupBy(userModel.id, userModel.name)
      .orderBy(desc(count(bookCirculationModel.id)))
      .limit(5),
    db
      .select({
        day: sql<string>`TO_CHAR(${bookCirculationModel.issueTimestamp}, 'YYYY-MM-DD')`,
        // IS NOT TRUE keeps NULL flags counted as plain issues.
        issues: sql<number>`COUNT(*) FILTER (WHERE ${bookCirculationModel.isReIssued} IS NOT TRUE)::int`,
        reissues: sql<number>`COUNT(*) FILTER (WHERE ${bookCirculationModel.isReIssued} IS TRUE)::int`,
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
    // Grouped by day × user type so the dashboard can draw one line per
    // patron type; the plain per-day total is derived from this in the
    // mapping below (left join keeps userless rows counted as Unknown).
    db
      .select({
        day: sql<string>`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
        category: sql<string>`COALESCE(${userModel.type}::text, 'Unknown')`,
        count: count(libraryEntryExitModel.id),
      })
      .from(libraryEntryExitModel)
      .leftJoin(userModel, eq(userModel.id, libraryEntryExitModel.userId))
      .where(entryExitConditions())
      .groupBy(
        sql`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
        userModel.type,
      )
      .orderBy(
        sql`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
      ),
    // Returns are keyed on the day the copy actually came back, not the
    // issue day, so they need their own grouped query; merged into the
    // daily circulation series below.
    db
      .select({
        day: sql<string>`TO_CHAR(${bookCirculationModel.actualReturnTimestamp}, 'YYYY-MM-DD')`,
        returns: sql<number>`COUNT(*)::int`,
      })
      .from(bookCirculationModel)
      .where(
        circulationConditions([
          isNotNull(bookCirculationModel.actualReturnTimestamp),
          ...(issueRangeStart
            ? [gte(bookCirculationModel.actualReturnTimestamp, issueRangeStart)]
            : []),
          ...(issueRangeEnd
            ? [lte(bookCirculationModel.actualReturnTimestamp, issueRangeEnd)]
            : []),
        ]),
      )
      .groupBy(
        sql`TO_CHAR(${bookCirculationModel.actualReturnTimestamp}, 'YYYY-MM-DD')`,
      )
      .orderBy(
        sql`TO_CHAR(${bookCirculationModel.actualReturnTimestamp}, 'YYYY-MM-DD')`,
      ),
  ]);

  // ---------------------------------------------------------------------------
  // Second pass — the four new tabs. Kept in their own Promise.all because the
  // destructure above is already at the limit of "readable", and every one of
  // these could conceivably be added later without moving the tiles.
  // ---------------------------------------------------------------------------

  const now2 = new Date();
  const monthStartLocal = new Date(now2.getFullYear(), now2.getMonth(), 1);
  const fineWaivedRange: SQL[] = [
    gte(bookCirculationModel.fineWaivedAt, filters.dateFrom ?? monthStartLocal),
  ];
  if (filters.dateTo) {
    fineWaivedRange.push(
      lte(bookCirculationModel.fineWaivedAt, filters.dateTo),
    );
  }

  const fineTimelineStart =
    filters.dateFrom ?? new Date(now2.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    [{ currentlyInLibrary }],
    [{ reissueCount }],
    [{ forcedIssueCount }],
    [{ finesWaivedThisMonth }],
    [{ avgLoanSeconds }],
    overdueAgeingRaw,
    booksByLanguageRaw,
    booksByPublisherRaw,
    booksByDocumentTypeRaw,
    copiesByRackRaw,
    booksAddedPerYearRaw,
    entriesByHourRaw,
    exitsByHourRaw,
    entriesByPatronCategoryRaw,
    [{ avgVisitSeconds }],
    finesByDayResult,
    outstandingByPatronRaw,
    overdueByPatronRaw,
    longestOverdueRaw,
    [{ reissueCountAllTime }],
    openLoansByCategoryRaw,
  ] = await Promise.all([
    // "In library now" — TODAY's (IST) entries still checked in. Matches the
    // entry/exit page's "Checked in" badge, which always filters date=today.
    // The today restriction is essential: the legacy system left thousands
    // of historical rows permanently CHECKED_IN with no exit recorded
    // (8.6k dangling all-time on develop), and nobody who entered last
    // month is still physically inside. Deliberately ignores the
    // dashboard's date-range filter — the tile is "now".
    db
      .select({ currentlyInLibrary: count() })
      .from(libraryEntryExitModel)
      .where(
        and(
          ...(filters.branchId != null
            ? [eq(libraryEntryExitModel.branchId, filters.branchId)]
            : []),
          eq(libraryEntryExitModel.currentStatus, "CHECKED_IN"),
          isNull(libraryEntryExitModel.exitTimestamp),
          gte(libraryEntryExitModel.entryTimestamp, istTodayStart()),
        ),
      ),
    // Scoped to the dashboard's date range like the Overview reissues
    // series — the unscoped count was 19k legacy renewals sitting next to
    // three "right now" tiles, which read as 19k renewals on 9k open loans.
    // (book_reissue.createdAt is import-time for legacy rows, so the issue
    // timestamp is the only range field with real legacy dates.)
    db
      .select({ reissueCount: count() })
      .from(bookCirculationModel)
      .where(
        circulationConditions([
          eq(bookCirculationModel.isReIssued, true),
          ...issueRange,
        ]),
      ),
    db
      .select({ forcedIssueCount: count() })
      .from(bookCirculationModel)
      .where(
        circulationConditions([eq(bookCirculationModel.isForcedIssue, true)]),
      ),
    db
      .select({
        finesWaivedThisMonth: sql<number>`COALESCE(SUM(${bookCirculationModel.fineWaiver}), 0)`,
      })
      .from(bookCirculationModel)
      .where(circulationConditions(fineWaivedRange)),
    db
      .select({
        avgLoanSeconds: sql<number>`COALESCE(EXTRACT(EPOCH FROM AVG(${bookCirculationModel.actualReturnTimestamp} - ${bookCirculationModel.issueTimestamp})), 0)`,
      })
      .from(bookCirculationModel)
      .where(
        circulationConditions([
          eq(bookCirculationModel.isReturned, true),
          sql`${bookCirculationModel.actualReturnTimestamp} IS NOT NULL`,
        ]),
      ),
    db
      .select({
        bucket: sql<
          "0-7" | "8-30" | ">30"
        >`CASE WHEN NOW() - ${bookCirculationModel.returnTimestamp} <= INTERVAL '7 days' THEN '0-7' WHEN NOW() - ${bookCirculationModel.returnTimestamp} <= INTERVAL '30 days' THEN '8-30' ELSE '>30' END`,
        count: count(),
      })
      .from(bookCirculationModel)
      .where(
        circulationConditions([
          eq(bookCirculationModel.isReturned, false),
          sql`${bookCirculationModel.returnTimestamp} < NOW()`,
        ]),
      )
      .groupBy(
        sql`CASE WHEN NOW() - ${bookCirculationModel.returnTimestamp} <= INTERVAL '7 days' THEN '0-7' WHEN NOW() - ${bookCirculationModel.returnTimestamp} <= INTERVAL '30 days' THEN '8-30' ELSE '>30' END`,
      ),
    db
      .select({
        language: sql<string>`COALESCE(${languageMediumModel.name}, 'Unknown')`,
        count: count(bookModel.id),
      })
      .from(bookModel)
      .leftJoin(
        languageMediumModel,
        eq(languageMediumModel.id, bookModel.languageId),
      )
      .where(bookConditions())
      .groupBy(languageMediumModel.name)
      .orderBy(desc(count(bookModel.id))),
    db
      .select({
        publisher: sql<string>`COALESCE(${publisherModel.name}, 'Unknown')`,
        count: count(bookModel.id),
      })
      .from(bookModel)
      .leftJoin(publisherModel, eq(publisherModel.id, bookModel.publisherId))
      .where(bookConditions())
      .groupBy(publisherModel.name)
      .orderBy(desc(count(bookModel.id)))
      .limit(10),
    db
      .select({
        documentType: sql<string>`COALESCE(${libraryDocumentTypeModel.name}, 'Unknown')`,
        count: count(bookModel.id),
      })
      .from(bookModel)
      .leftJoin(
        libraryDocumentTypeModel,
        eq(libraryDocumentTypeModel.id, bookModel.libraryDocumentTypeId),
      )
      .where(bookConditions())
      .groupBy(libraryDocumentTypeModel.name)
      .orderBy(desc(count(bookModel.id))),
    db
      .select({
        rack: sql<string>`COALESCE(${rackModel.name}, 'Unassigned')`,
        count: count(copyDetailsModel.id),
      })
      .from(copyDetailsModel)
      .leftJoin(rackModel, eq(rackModel.id, copyDetailsModel.rackId))
      .where(copyConditions())
      .groupBy(rackModel.name)
      .orderBy(desc(count(copyDetailsModel.id)))
      .limit(10),
    db
      .select({
        year: sql<string>`EXTRACT(YEAR FROM ${bookModel.createdAt})::text`,
        count: count(bookModel.id),
      })
      .from(bookModel)
      .where(bookConditions())
      .groupBy(sql`EXTRACT(YEAR FROM ${bookModel.createdAt})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${bookModel.createdAt})`),
    // Entries/exits by hour — respect the dashboard date filter so setting a
    // range on the page updates the chart. Was hard-coded to today only in an
    // earlier iteration; the user hit an empty chart on days without traffic
    // yet, so they now expect it to reflect whatever window they picked.
    db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${libraryEntryExitModel.entryTimestamp})::int`,
        count: count(),
      })
      .from(libraryEntryExitModel)
      .where(entryExitConditions())
      .groupBy(sql`EXTRACT(HOUR FROM ${libraryEntryExitModel.entryTimestamp})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${libraryEntryExitModel.entryTimestamp})`),
    // Exits by hour — same shape, different timestamp. Only rows with a
    // recorded exit contribute (a still-checked-in row has no exit hour).
    db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${libraryEntryExitModel.exitTimestamp})::int`,
        count: count(),
      })
      .from(libraryEntryExitModel)
      .where(
        and(
          ...(filters.branchId != null
            ? [eq(libraryEntryExitModel.branchId, filters.branchId)]
            : []),
          ...(filters.dateFrom
            ? [gte(libraryEntryExitModel.exitTimestamp, filters.dateFrom)]
            : []),
          ...(filters.dateTo
            ? [lte(libraryEntryExitModel.exitTimestamp, filters.dateTo)]
            : []),
          sql`${libraryEntryExitModel.exitTimestamp} IS NOT NULL`,
        ),
      )
      .groupBy(sql`EXTRACT(HOUR FROM ${libraryEntryExitModel.exitTimestamp})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${libraryEntryExitModel.exitTimestamp})`),
    db
      .select({
        category: sql<string>`COALESCE(${userModel.type}::text, 'Unknown')`,
        count: count(libraryEntryExitModel.id),
      })
      .from(libraryEntryExitModel)
      .innerJoin(userModel, eq(userModel.id, libraryEntryExitModel.userId))
      .where(entryExitConditions())
      .groupBy(userModel.type)
      .orderBy(desc(count(libraryEntryExitModel.id))),
    db
      .select({
        avgVisitSeconds: sql<number>`COALESCE(EXTRACT(EPOCH FROM AVG(${libraryEntryExitModel.exitTimestamp} - ${libraryEntryExitModel.entryTimestamp})), 0)`,
      })
      .from(libraryEntryExitModel)
      .where(
        and(
          ...(filters.branchId != null
            ? [eq(libraryEntryExitModel.branchId, filters.branchId)]
            : []),
          sql`${libraryEntryExitModel.exitTimestamp} IS NOT NULL`,
        ),
      ),
    // Fines timeline: paid (from payments) + waived (from circulation), per day.
    // Each source is pre-aggregated to ONE row per day in its own subquery
    // BEFORE joining the day spine. Joining the two one-to-many children
    // (payments, book_circulation) directly to the spine and SUM-ing produced a
    // P×C cartesian per day — on any day with both a payment and a waiver,
    // `collected` was multiplied by the waiver count and `waived` by the payment
    // count. Pre-aggregating keeps each join one-row-per-day, so no fan-out.
    db.execute(sql`
      SELECT d::date::text AS day,
             COALESCE(pay.collected, 0) AS collected,
             COALESCE(wv.waived, 0) AS waived
      FROM generate_series(${fineTimelineStart}::date, NOW()::date, INTERVAL '1 day') AS d
      LEFT JOIN (
        SELECT created_at::date AS day, SUM(amount) AS collected
        FROM payments
        WHERE context = 'LIBRARY_FINE'
          AND status = 'SUCCESS'
          AND created_at::date >= ${fineTimelineStart}::date
        GROUP BY created_at::date
      ) pay ON pay.day = d::date
      LEFT JOIN (
        SELECT fine_waived_at::date AS day, SUM(fine_waiver) AS waived
        FROM book_circulation
        WHERE fine_waived_at IS NOT NULL
          AND fine_waived_at::date >= ${fineTimelineStart}::date
        GROUP BY fine_waived_at::date
      ) wv ON wv.day = d::date
      ORDER BY d
    `),
    db
      .select({
        userId: userModel.id,
        userName: userModel.name,
        amount: sql<number>`COALESCE(SUM(${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver}), 0)`,
      })
      .from(bookCirculationModel)
      .innerJoin(userModel, eq(userModel.id, bookCirculationModel.userId))
      .where(
        circulationConditions([
          isNull(bookCirculationModel.paymentId),
          sql`${bookCirculationModel.fineAmount} > ${bookCirculationModel.fineWaiver}`,
        ]),
      )
      .groupBy(userModel.id, userModel.name)
      .orderBy(
        desc(
          sql`SUM(${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver})`,
        ),
      )
      .limit(10),
    // Overdue borrowers — who to chase first. Open loans past due, grouped
    // by borrower; "now"-scoped like the Overdue tile (not the date filter).
    // Student UID via left join (staff have no student row → null).
    db
      .select({
        userId: userModel.id,
        userName: userModel.name,
        // Students carry a UID; staff fall back to their staff UID / code.
        uid: sql<
          string | null
        >`COALESCE(${studentModel.uid}, ${staffModel.uid}, ${staffModel.codeNumber})`,
        category: sql<string>`COALESCE(${userModel.type}::text, 'Unknown')`,
        count: count(bookCirculationModel.id),
      })
      .from(bookCirculationModel)
      .innerJoin(userModel, eq(userModel.id, bookCirculationModel.userId))
      .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
      .leftJoin(staffModel, eq(staffModel.userId, userModel.id))
      .where(
        circulationConditions([
          eq(bookCirculationModel.isReturned, false),
          sql`${bookCirculationModel.returnTimestamp} < NOW()`,
        ]),
      )
      .groupBy(
        userModel.id,
        userModel.name,
        userModel.type,
        studentModel.uid,
        staffModel.uid,
        staffModel.codeNumber,
      )
      .orderBy(desc(count(bookCirculationModel.id)))
      .limit(10),
    // Longest-overdue open loans — oldest due date first.
    db
      .select({
        circulationId: bookCirculationModel.id,
        title: bookModel.title,
        userName: userModel.name,
        uid: sql<
          string | null
        >`COALESCE(${studentModel.uid}, ${staffModel.uid}, ${staffModel.codeNumber})`,
        category: sql<string>`COALESCE(${userModel.type}::text, 'Unknown')`,
        dueDate: sql<string>`TO_CHAR(${bookCirculationModel.returnTimestamp}, 'YYYY-MM-DD')`,
        daysOverdue: sql<number>`FLOOR(EXTRACT(EPOCH FROM (NOW() - ${bookCirculationModel.returnTimestamp})) / 86400)::int`,
      })
      .from(bookCirculationModel)
      .innerJoin(
        copyDetailsModel,
        eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
      )
      .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
      .innerJoin(userModel, eq(userModel.id, bookCirculationModel.userId))
      .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
      .leftJoin(staffModel, eq(staffModel.userId, userModel.id))
      .where(
        circulationConditions([
          eq(bookCirculationModel.isReturned, false),
          sql`${bookCirculationModel.returnTimestamp} < NOW()`,
        ]),
      )
      .orderBy(bookCirculationModel.returnTimestamp)
      .limit(10),
    // All-time renewed loans — context for the range-scoped Reissues tile
    // (a "0 today" reads as broken without the historical footnote).
    db
      .select({ reissueCountAllTime: count() })
      .from(bookCirculationModel)
      .where(
        circulationConditions([eq(bookCirculationModel.isReIssued, true)]),
      ),
    // Open loans split by user type — same grouping as the visits chart.
    db
      .select({
        category: sql<string>`COALESCE(${userModel.type}::text, 'Unknown')`,
        count: count(bookCirculationModel.id),
      })
      .from(bookCirculationModel)
      .leftJoin(userModel, eq(userModel.id, bookCirculationModel.userId))
      .where(
        circulationConditions([eq(bookCirculationModel.isReturned, false)]),
      )
      .groupBy(userModel.type)
      .orderBy(desc(count(bookCirculationModel.id))),
  ]);

  // DISTINCT publisher + language counts — separate cheap queries because
  // `booksByLanguage.length` is capped by the top-N slice above and
  // `booksByPublisher.length` is hard-capped at 10, both of which
  // under-count for the dashboard tile.
  const [[{ totalPublishers }], [{ totalLanguages }]] = await Promise.all([
    db
      .select({
        totalPublishers: sql<number>`COUNT(DISTINCT ${bookModel.publisherId})::int`,
      })
      .from(bookModel)
      .where(bookConditions()),
    db
      .select({
        totalLanguages: sql<number>`COUNT(DISTINCT ${bookModel.languageId})::int`,
      })
      .from(bookModel)
      .where(bookConditions()),
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
    // Union of issue-days and return-days — a day can have returns with no
    // fresh issues (or vice versa) and still needs a point on the chart.
    dailyIssuesLast14: (() => {
      const issuesByDay = new Map(dailyIssuesRaw.map((r) => [r.day, r]));
      const returnsByDay = new Map(
        dailyReturnsRaw.map((r) => [r.day, Number(r.returns)]),
      );
      const allDays = Array.from(
        new Set([...issuesByDay.keys(), ...returnsByDay.keys()]),
      ).sort();
      return allDays.map((day) => {
        const r = issuesByDay.get(day);
        const issues = Number(r?.issues ?? 0);
        const reissues = Number(r?.reissues ?? 0);
        return {
          day,
          issues,
          reissues,
          returns: returnsByDay.get(day) ?? 0,
          count: issues + reissues,
        };
      });
    })(),
    copiesByStatus: copiesByStatusRaw.map((r) => ({
      statusId: r.statusId,
      statusName: r.statusName ?? "Unknown",
      count: r.count,
    })),
    entryExitByDay: (() => {
      const totals = new Map<string, number>();
      for (const r of entryExitByDayRaw) {
        totals.set(r.day, (totals.get(r.day) ?? 0) + Number(r.count));
      }
      return Array.from(totals.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, count]) => ({ day, count }));
    })(),
    entryExitByDayByCategory: entryExitByDayRaw.map((r) => ({
      day: r.day,
      category: r.category,
      count: Number(r.count),
    })),

    // Placeholder zeros — the type carries totalJournals/Series/Holidays for
    // the dashboard tiles, but the corresponding queries aren't wired yet.
    // Kept as 0 so this file compiles; the "Article entries" and "Holidays"
    // tabs pull real counts from library-catalogue-counts + holidays-report.
    totalJournals: 0,
    totalSeries: 0,
    totalHolidays: 0,

    currentlyInLibrary: currentlyInLibrary ?? 0,
    reissueCount: reissueCount ?? 0,
    forcedIssueCount: forcedIssueCount ?? 0,
    finesWaivedThisMonth: Number(finesWaivedThisMonth ?? 0),
    avgLoanDays: Number(avgLoanSeconds ?? 0) / 86400,
    overdueAgeing: overdueAgeingRaw.map((r) => ({
      bucket: r.bucket,
      count: Number(r.count),
    })),

    booksByLanguage: booksByLanguageRaw.map((r) => ({
      language: r.language,
      count: Number(r.count),
    })),
    booksByPublisher: booksByPublisherRaw.map((r) => ({
      publisher: r.publisher,
      count: Number(r.count),
    })),
    booksByDocumentType: booksByDocumentTypeRaw.map((r) => ({
      documentType: r.documentType,
      count: Number(r.count),
    })),
    copiesByRack: copiesByRackRaw.map((r) => ({
      rack: r.rack,
      count: Number(r.count),
    })),
    booksAddedPerYear: booksAddedPerYearRaw.map((r) => ({
      year: r.year,
      count: Number(r.count),
    })),
    totalPublishers: Number(totalPublishers ?? 0),
    totalLanguages: Number(totalLanguages ?? 0),

    exitsByHourOfDay: exitsByHourRaw.map((r) => ({
      hour: Number(r.hour),
      count: Number(r.count),
    })),
    entriesByHourOfDay: entriesByHourRaw.map((r) => ({
      hour: Number(r.hour),
      count: Number(r.count),
    })),
    entriesByPatronCategory: entriesByPatronCategoryRaw.map((r) => ({
      category: r.category,
      count: Number(r.count),
    })),
    avgVisitMinutes: Number(avgVisitSeconds ?? 0) / 60,

    finesByDay: (
      finesByDayResult.rows as unknown as Array<{
        day: string;
        collected: number;
        waived: number;
      }>
    ).map((r) => ({
      day: r.day,
      collected: Number(r.collected),
      waived: Number(r.waived),
    })),
    reissueCountAllTime: reissueCountAllTime ?? 0,
    overdueByPatron: overdueByPatronRaw.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      uid: r.uid,
      category: patronOf(r.category),
      count: r.count,
    })),
    longestOverdue: longestOverdueRaw.map((r) => ({
      circulationId: r.circulationId,
      title: r.title,
      userName: r.userName,
      uid: r.uid,
      category: patronOf(r.category),
      dueDate: r.dueDate,
      daysOverdue: Number(r.daysOverdue),
    })),
    openLoansByCategory: openLoansByCategoryRaw.map((r) => ({
      category: r.category,
      count: r.count,
    })),
    outstandingByPatron: outstandingByPatronRaw.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      amount: Number(r.amount),
    })),
  };
}
