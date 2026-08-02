/**
 * Usage / analytics reports for the library module — footfall, holdings,
 * popular titles, publication usage and batch-wise demographics.
 *
 * Same conventions as library-operational-reports.service.ts: every function
 * returns a structured payload the UI renders as a table (and exports to
 * Excel). List-style reports are server-paginated because some dimensions are
 * large (publishers alone is ~4k rows).
 *
 * Everything reads the NEW Postgres only — never the legacy MySQL.
 */

import { db } from "@/db/index.js";
import { and, count, desc, eq, gte, lte, sql, SQL } from "drizzle-orm";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";
import { seriesModel } from "@repo/db/schemas/models/library/series.model.js";
import { journalSubscriptionModel } from "@repo/db/schemas/models/library/journal-subscription.model.js";
import { libraryEntryExitModel } from "@repo/db/schemas/models/library/library-entry-exit.model.js";
import { libraryZoneModel } from "@repo/db/schemas/models/library/library-zone.model.js";
import { languageMediumModel } from "@repo/db/schemas/models/resources/languageMedium.model.js";

export type AnalyticsFilters = {
  branchId?: number;
  dateFrom?: Date;
  dateTo?: Date;
};

export type Paginated<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
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

const clampPage = (page?: number, pageSize?: number) => {
  const size = Math.min(Math.max(pageSize ?? 10, 1), 100);
  const p = Math.max(page ?? 1, 1);
  return { page: p, pageSize: size, offset: (p - 1) * size };
};

const paginate = <T>(
  content: T[],
  totalElements: number,
  page: number,
  pageSize: number,
): Paginated<T> => ({
  content,
  totalElements,
  totalPages: Math.max(1, Math.ceil(totalElements / pageSize)),
  page,
  pageSize,
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Footfall — daily counts, hour histogram, zone breakdown.
// ─────────────────────────────────────────────────────────────────────────────

export type FootfallPayload = {
  daily: Array<{
    date: string;
    entries: number;
    uniqueVisitors: number;
    avgDurationMinutes: number;
  }>;
  byHour: Array<{ hour: number; entries: number }>;
  byZone: Array<{ zoneId: number | null; zoneName: string; entries: number }>;
};

export async function getFootfallReport(
  filters: AnalyticsFilters,
): Promise<FootfallPayload> {
  const where = compose(
    branchCond(filters.branchId, libraryEntryExitModel.branchId),
    ...rangeCond(
      filters.dateFrom,
      filters.dateTo,
      libraryEntryExitModel.entryTimestamp,
    ),
  );

  const [dailyRaw, byHourRaw, byZoneRaw] = await Promise.all([
    db
      .select({
        date: sql<string>`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
        entries: count(),
        uniqueVisitors: sql<number>`COUNT(DISTINCT ${libraryEntryExitModel.userId})::int`,
        avgDurationMinutes: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${libraryEntryExitModel.exitTimestamp} - ${libraryEntryExitModel.entryTimestamp})) / 60) FILTER (WHERE ${libraryEntryExitModel.exitTimestamp} IS NOT NULL), 0)`,
      })
      .from(libraryEntryExitModel)
      .where(where)
      .groupBy(
        sql`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
      )
      .orderBy(
        desc(
          sql`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
        ),
      )
      .limit(400),
    db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${libraryEntryExitModel.entryTimestamp})::int`,
        entries: count(),
      })
      .from(libraryEntryExitModel)
      .where(where)
      .groupBy(sql`EXTRACT(HOUR FROM ${libraryEntryExitModel.entryTimestamp})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${libraryEntryExitModel.entryTimestamp})`),
    db
      .select({
        zoneId: libraryEntryExitModel.zoneId,
        zoneName: sql<string>`COALESCE(${libraryZoneModel.name}, '(no zone)')`,
        entries: count(),
      })
      .from(libraryEntryExitModel)
      .leftJoin(
        libraryZoneModel,
        eq(libraryZoneModel.id, libraryEntryExitModel.zoneId),
      )
      .where(where)
      .groupBy(libraryEntryExitModel.zoneId, libraryZoneModel.name)
      .orderBy(desc(count())),
  ]);

  return {
    daily: dailyRaw.map((r) => ({
      date: r.date,
      entries: Number(r.entries),
      uniqueVisitors: Number(r.uniqueVisitors),
      avgDurationMinutes: Math.round(Number(r.avgDurationMinutes)),
    })),
    byHour: byHourRaw.map((r) => ({
      hour: Number(r.hour),
      entries: Number(r.entries),
    })),
    byZone: byZoneRaw.map((r) => ({
      zoneId: r.zoneId,
      zoneName: r.zoneName,
      entries: Number(r.entries),
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Holdings — books & copies grouped by a switchable dimension.
// ─────────────────────────────────────────────────────────────────────────────

export type HoldingsGroupBy = "category" | "status" | "language" | "publisher";

export type HoldingsRow = {
  groupId: number | null;
  groupName: string;
  bookCount: number;
  copyCount: number;
  totalPriceINR: number;
};

export async function getHoldingsReport(
  filters: AnalyticsFilters,
  groupBy: HoldingsGroupBy,
  pageOpt?: number,
  pageSizeOpt?: number,
): Promise<Paginated<HoldingsRow>> {
  const { page, pageSize, offset } = clampPage(pageOpt, pageSizeOpt);
  const where = compose(
    branchCond(filters.branchId, copyDetailsModel.branchId),
  );

  const dims = {
    category: {
      id: copyDetailsModel.itemCategoryId,
      name: sql<string>`COALESCE(${itemCategoryModel.name}, '(uncategorised)')`,
      join: (q: any) =>
        q.leftJoin(
          itemCategoryModel,
          eq(itemCategoryModel.id, copyDetailsModel.itemCategoryId),
        ),
    },
    status: {
      id: copyDetailsModel.statusId,
      name: sql<string>`COALESCE(${statusModel.name}, '(no status)')`,
      join: (q: any) =>
        q.leftJoin(statusModel, eq(statusModel.id, copyDetailsModel.statusId)),
    },
    language: {
      id: bookModel.languageId,
      name: sql<string>`COALESCE(${languageMediumModel.name}, 'Unknown')`,
      join: (q: any) =>
        q.leftJoin(
          languageMediumModel,
          eq(languageMediumModel.id, bookModel.languageId),
        ),
    },
    publisher: {
      id: bookModel.publisherId,
      name: sql<string>`COALESCE(${publisherModel.name}, '(no publisher)')`,
      join: (q: any) =>
        q.leftJoin(
          publisherModel,
          eq(publisherModel.id, bookModel.publisherId),
        ),
    },
  }[groupBy];

  const base = () =>
    dims.join(
      db
        .select({
          groupId: dims.id,
          groupName: dims.name,
          bookCount: sql<number>`COUNT(DISTINCT ${bookModel.id})::int`,
          copyCount: count(copyDetailsModel.id),
          totalPriceINR: sql<number>`COALESCE(SUM(${copyDetailsModel.priceInINR}), 0)`,
        })
        .from(copyDetailsModel)
        .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId)),
    );

  const [rows, totalRaw] = await Promise.all([
    base()
      .where(where)
      .groupBy(dims.id, dims.name)
      .orderBy(desc(count(copyDetailsModel.id)))
      .limit(pageSize)
      .offset(offset),
    dims
      .join(
        db
          .select({
            total: sql<number>`COUNT(DISTINCT COALESCE(${dims.id}, -1))::int`,
          })
          .from(copyDetailsModel)
          .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId)),
      )
      .where(where),
  ]);

  const totalElements = Number(totalRaw[0]?.total ?? 0);
  return paginate(
    rows.map((r: any) => ({
      groupId: r.groupId,
      groupName: r.groupName,
      bookCount: Number(r.bookCount),
      copyCount: Number(r.copyCount),
      totalPriceINR: Number(r.totalPriceINR),
    })),
    totalElements,
    page,
    pageSize,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Accession growth — copies added per year (bill date).
// ─────────────────────────────────────────────────────────────────────────────

export type AccessionGrowthRow = {
  year: string;
  copiesAdded: number;
  cumulative: number;
};

export async function getAccessionGrowth(
  filters: AnalyticsFilters,
): Promise<AccessionGrowthRow[]> {
  const where = compose(
    branchCond(filters.branchId, copyDetailsModel.branchId),
  );
  const raw = await db
    .select({
      year: sql<string>`COALESCE(EXTRACT(YEAR FROM ${copyDetailsModel.billDate})::text, 'Unknown')`,
      copiesAdded: count(),
    })
    .from(copyDetailsModel)
    .where(where)
    .groupBy(
      sql`COALESCE(EXTRACT(YEAR FROM ${copyDetailsModel.billDate})::text, 'Unknown')`,
    )
    .orderBy(
      sql`COALESCE(EXTRACT(YEAR FROM ${copyDetailsModel.billDate})::text, 'Unknown')`,
    );

  let running = 0;
  return raw.map((r) => {
    running += Number(r.copiesAdded);
    return {
      year: r.year,
      copiesAdded: Number(r.copiesAdded),
      cumulative: running,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Copies-per-book distribution.
// ─────────────────────────────────────────────────────────────────────────────

export type CopiesDistributionRow = {
  bucket: "1" | "2-3" | "4-5" | "6-10" | "10+";
  bookCount: number;
};

export async function getCopiesDistribution(
  filters: AnalyticsFilters,
): Promise<CopiesDistributionRow[]> {
  const branchSql =
    filters.branchId == null
      ? sql``
      : sql`WHERE ${copyDetailsModel.branchId} = ${filters.branchId}`;
  const result = await db.execute(sql`
    SELECT bucket, COUNT(*)::int AS book_count
    FROM (
      SELECT CASE
        WHEN c.copies = 1 THEN '1'
        WHEN c.copies BETWEEN 2 AND 3 THEN '2-3'
        WHEN c.copies BETWEEN 4 AND 5 THEN '4-5'
        WHEN c.copies BETWEEN 6 AND 10 THEN '6-10'
        ELSE '10+'
      END AS bucket
      FROM (
        SELECT ${copyDetailsModel.bookId} AS book_id, COUNT(*) AS copies
        FROM ${copyDetailsModel}
        ${branchSql}
        GROUP BY ${copyDetailsModel.bookId}
      ) c
    ) b
    GROUP BY bucket
  `);
  const order: CopiesDistributionRow["bucket"][] = [
    "1",
    "2-3",
    "4-5",
    "6-10",
    "10+",
  ];
  const byBucket = new Map(
    (result.rows as Array<{ bucket: string; book_count: number }>).map((r) => [
      r.bucket,
      Number(r.book_count),
    ]),
  );
  return order.map((bucket) => ({
    bucket,
    bookCount: byBucket.get(bucket) ?? 0,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Popular books — by circulation count + unique readers.
// ─────────────────────────────────────────────────────────────────────────────

export type PopularBookRow = {
  bookId: number;
  title: string;
  isbn: string | null;
  categoryName: string;
  issueCount: number;
  uniqueReaders: number;
};

export async function getPopularBooks(
  filters: AnalyticsFilters,
  opts?: { itemCategoryId?: number; page?: number; pageSize?: number },
): Promise<Paginated<PopularBookRow>> {
  const { page, pageSize, offset } = clampPage(opts?.page, opts?.pageSize);
  const where = compose(
    branchCond(filters.branchId, bookCirculationModel.branchId),
    ...rangeCond(
      filters.dateFrom,
      filters.dateTo,
      bookCirculationModel.issueTimestamp,
    ),
    opts?.itemCategoryId == null
      ? undefined
      : eq(copyDetailsModel.itemCategoryId, opts.itemCategoryId),
  );

  const [rows, totalRaw] = await Promise.all([
    db
      .select({
        bookId: bookModel.id,
        title: bookModel.title,
        isbn: bookModel.isbn,
        categoryName: sql<string>`COALESCE(MIN(${itemCategoryModel.name}), '(uncategorised)')`,
        issueCount: count(bookCirculationModel.id),
        uniqueReaders: sql<number>`COUNT(DISTINCT ${bookCirculationModel.userId})::int`,
      })
      .from(bookCirculationModel)
      .innerJoin(
        copyDetailsModel,
        eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
      )
      .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
      .leftJoin(
        itemCategoryModel,
        eq(itemCategoryModel.id, copyDetailsModel.itemCategoryId),
      )
      .where(where)
      .groupBy(bookModel.id, bookModel.title, bookModel.isbn)
      .orderBy(desc(count(bookCirculationModel.id)))
      .limit(pageSize)
      .offset(offset),
    db
      .select({
        total: sql<number>`COUNT(DISTINCT ${bookModel.id})::int`,
      })
      .from(bookCirculationModel)
      .innerJoin(
        copyDetailsModel,
        eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
      )
      .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
      .where(where),
  ]);

  return paginate(
    rows.map((r) => ({
      bookId: r.bookId,
      title: r.title,
      isbn: r.isbn,
      categoryName: r.categoryName,
      issueCount: Number(r.issueCount),
      uniqueReaders: Number(r.uniqueReaders),
    })),
    Number(totalRaw[0]?.total ?? 0),
    page,
    pageSize,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Publication usage — circulation aggregated by publisher/journal/series.
// ─────────────────────────────────────────────────────────────────────────────

export type PublicationDimension = "publisher" | "journal" | "series";

export type PublicationUsageRow = {
  id: number;
  name: string;
  titleCount: number;
  issueCount: number;
  uniqueReaders: number;
  issnNumber: string | null;
  activeSubscriptions: number | null;
};

export async function getPublicationUsage(
  filters: AnalyticsFilters,
  dimension: PublicationDimension,
  pageOpt?: number,
  pageSizeOpt?: number,
): Promise<Paginated<PublicationUsageRow>> {
  const { page, pageSize, offset } = clampPage(pageOpt, pageSizeOpt);
  const where = compose(
    branchCond(filters.branchId, bookCirculationModel.branchId),
    ...rangeCond(
      filters.dateFrom,
      filters.dateTo,
      bookCirculationModel.issueTimestamp,
    ),
  );

  const dim = {
    publisher: {
      model: publisherModel,
      idCol: publisherModel.id,
      fk: bookModel.publisherId,
      name: publisherModel.name,
    },
    journal: {
      model: journalModel,
      idCol: journalModel.id,
      fk: bookModel.journalId,
      name: journalModel.title,
    },
    series: {
      model: seriesModel,
      idCol: seriesModel.id,
      fk: bookModel.seriesId,
      name: seriesModel.name,
    },
  }[dimension];

  const [rows, totalRaw] = await Promise.all([
    db
      .select({
        id: dim.idCol,
        name: dim.name,
        titleCount: sql<number>`COUNT(DISTINCT ${bookModel.id})::int`,
        issueCount: count(bookCirculationModel.id),
        uniqueReaders: sql<number>`COUNT(DISTINCT ${bookCirculationModel.userId})::int`,
      })
      .from(bookCirculationModel)
      .innerJoin(
        copyDetailsModel,
        eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
      )
      .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
      .innerJoin(dim.model, eq(dim.idCol, dim.fk))
      .where(where)
      .groupBy(dim.idCol, dim.name)
      .orderBy(desc(count(bookCirculationModel.id)))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`COUNT(DISTINCT ${dim.fk})::int` })
      .from(bookCirculationModel)
      .innerJoin(
        copyDetailsModel,
        eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
      )
      .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
      .where(compose(where, sql`${dim.fk} IS NOT NULL`)),
  ]);

  // Journal extras — ISSN + currently-active subscription count.
  let issnById = new Map<number, string | null>();
  let subsById = new Map<number, number>();
  if (dimension === "journal" && rows.length > 0) {
    const ids = rows.map((r) => Number(r.id));
    const inIds = sql.join(
      ids.map((i) => sql`${i}`),
      sql`, `,
    );
    const [issnRows, subRows] = await Promise.all([
      db
        .select({ id: journalModel.id, issnNumber: journalModel.issnNumber })
        .from(journalModel)
        .where(sql`${journalModel.id} IN (${inIds})`),
      db
        .select({
          journalId: journalSubscriptionModel.journalId,
          active: count(),
        })
        .from(journalSubscriptionModel)
        .where(
          and(
            sql`${journalSubscriptionModel.journalId} IN (${inIds})`,
            sql`${journalSubscriptionModel.endDate} >= CURRENT_DATE`,
          ),
        )
        .groupBy(journalSubscriptionModel.journalId),
    ]);
    issnById = new Map(issnRows.map((r) => [r.id, r.issnNumber]));
    subsById = new Map(
      subRows
        .filter((r) => r.journalId != null)
        .map((r) => [r.journalId as number, Number(r.active)]),
    );
  }

  return paginate(
    rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      titleCount: Number(r.titleCount),
      issueCount: Number(r.issueCount),
      uniqueReaders: Number(r.uniqueReaders),
      issnNumber:
        dimension === "journal" ? (issnById.get(Number(r.id)) ?? null) : null,
      activeSubscriptions:
        dimension === "journal" ? (subsById.get(Number(r.id)) ?? 0) : null,
    })),
    Number(totalRaw[0]?.total ?? 0),
    page,
    pageSize,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Batch-wise usage — circulation/footfall attributed to the promotion
//    active at the event time (falling back to the student's latest one).
// ─────────────────────────────────────────────────────────────────────────────

export type BatchUsageMetric = "circulation" | "footfall";

export type BatchUsageRow = {
  programCourseName: string;
  className: string;
  sessionName: string;
  shiftName: string;
  studentCount: number;
  eventCount: number;
  eventsPerStudent: number;
};

export async function getBatchUsage(
  filters: AnalyticsFilters,
  metric: BatchUsageMetric,
  pageOpt?: number,
  pageSizeOpt?: number,
): Promise<Paginated<BatchUsageRow>> {
  const { page, pageSize, offset } = clampPage(pageOpt, pageSizeOpt);

  const eventTable =
    metric === "circulation" ? sql`book_circulation` : sql`library_entry_exit`;
  const eventTs =
    metric === "circulation" ? sql`e.issue_timestamp` : sql`e.entry_timestamp`;

  const conds: SQL[] = [];
  if (filters.branchId != null)
    conds.push(sql`e.branch_id_fk = ${filters.branchId}`);
  if (filters.dateFrom) conds.push(sql`${eventTs} >= ${filters.dateFrom}`);
  if (filters.dateTo) conds.push(sql`${eventTs} <= ${filters.dateTo}`);
  const whereSql =
    conds.length > 0 ? sql`WHERE ${sql.join(conds, sql` AND `)}` : sql``;

  // The LATERAL picks ONE promotion per event: prefer the one whose
  // start/end window covers the event timestamp, else the student's latest.
  const grouped = sql`
    FROM ${eventTable} e
    JOIN students s ON s.user_id_fk = e.user_id_fk
    JOIN LATERAL (
      SELECT pr.program_course_id_fk, pr.class_id_fk, pr.session_id_fk,
             pr.shift_id_fk, pr.student_id_fk
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
    ${whereSql}
    GROUP BY COALESCE(pc.name, '(unknown)'), COALESCE(cls.name, '(unknown)'),
             COALESCE(ses.name, '(unknown)'), COALESCE(sh.name, '(unknown)')
  `;

  const [result, totalResult] = await Promise.all([
    db.execute(sql`
      SELECT COALESCE(pc.name, '(unknown)') AS program_course_name,
             COALESCE(cls.name, '(unknown)') AS class_name,
             COALESCE(ses.name, '(unknown)') AS session_name,
             COALESCE(sh.name, '(unknown)') AS shift_name,
             COUNT(DISTINCT s.id)::int AS student_count,
             COUNT(*)::int AS event_count
      ${grouped}
      ORDER BY event_count DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    db.execute(sql`SELECT COUNT(*)::int AS total FROM (SELECT 1 ${grouped}) g`),
  ]);

  type Raw = {
    program_course_name: string;
    class_name: string;
    session_name: string;
    shift_name: string;
    student_count: number;
    event_count: number;
  };
  const totalElements = Number(
    (totalResult.rows[0] as { total?: number } | undefined)?.total ?? 0,
  );

  return paginate(
    (result.rows as Raw[]).map((r) => ({
      programCourseName: r.program_course_name,
      className: r.class_name,
      sessionName: r.session_name,
      shiftName: r.shift_name,
      studentCount: Number(r.student_count),
      eventCount: Number(r.event_count),
      eventsPerStudent:
        Number(r.student_count) > 0
          ? Math.round((Number(r.event_count) / Number(r.student_count)) * 10) /
            10
          : 0,
    })),
    totalElements,
    page,
    pageSize,
  );
}
