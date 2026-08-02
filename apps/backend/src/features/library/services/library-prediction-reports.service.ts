/**
 * Statistical prediction reports for the library — no ML dependencies.
 *
 * Both forecasts run cheap SQL aggregates over the trailing 18 months and do
 * the arithmetic in TypeScript: seasonal indexes (month-of-year for book
 * demand, day-of-week × month for footfall), a recent-trend moving average and
 * an exam-proximity uplift factor learned from historical `exam_groups`
 * commencement dates. Sparse history degrades gracefully: indexes fall back to
 * 1 and rows are flagged `confidence: "low"` rather than extrapolating noise.
 */

import { db } from "@/db/index.js";
import { and, count, desc, eq, gte, sql, SQL } from "drizzle-orm";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { libraryEntryExitModel } from "@repo/db/schemas/models/library/library-entry-exit.model.js";
import { examGroupModel } from "@repo/db/schemas/models/exams/exam-group.model.js";

const TRAILING_MONTHS = 18;
const EXAM_WINDOW_DAYS = 14;

export type PredictionFilters = {
  branchId?: number;
};

const branchCond = (b: number | undefined, col: any): SQL | undefined =>
  b == null ? undefined : eq(col, b);

const compose = (...parts: Array<SQL | undefined>): SQL | undefined => {
  const real = parts.filter((p): p is SQL => p != null);
  return real.length === 0 ? undefined : and(...real);
};

const monthsAgo = (n: number): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

const ymKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Book-demand forecast.
// ─────────────────────────────────────────────────────────────────────────────

export type BookDemandForecastRow = {
  bookId: number;
  title: string;
  recentMonthlyAvg: number;
  seasonalIndex: number;
  predictedDemand: number;
  trend: "up" | "flat" | "down";
  confidence: "high" | "medium" | "low";
};

export type BookDemandForecastPayload = {
  horizonDays: number;
  rows: BookDemandForecastRow[];
};

export async function getBookDemandForecast(
  filters: PredictionFilters,
  opts?: { horizonDays?: number; itemCategoryId?: number; limit?: number },
): Promise<BookDemandForecastPayload> {
  const horizonDays = opts?.horizonDays === 60 ? 60 : 30;
  const limit = Math.min(opts?.limit ?? 25, 100);
  const since = monthsAgo(TRAILING_MONTHS);

  const where = compose(
    branchCond(filters.branchId, bookCirculationModel.branchId),
    gte(bookCirculationModel.issueTimestamp, since),
    opts?.itemCategoryId == null
      ? undefined
      : eq(copyDetailsModel.itemCategoryId, opts.itemCategoryId),
  );

  // One aggregate: issues per (book, calendar month) over the trailing window.
  const raw = await db
    .select({
      bookId: bookModel.id,
      title: bookModel.title,
      month: sql<string>`TO_CHAR(${bookCirculationModel.issueTimestamp}, 'YYYY-MM')`,
      issues: count(),
    })
    .from(bookCirculationModel)
    .innerJoin(
      copyDetailsModel,
      eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
    )
    .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
    .where(where)
    .groupBy(
      bookModel.id,
      bookModel.title,
      sql`TO_CHAR(${bookCirculationModel.issueTimestamp}, 'YYYY-MM')`,
    );

  type PerBook = { title: string; byMonth: Map<string, number>; total: number };
  const perBook = new Map<number, PerBook>();
  for (const r of raw) {
    let b = perBook.get(r.bookId);
    if (!b) {
      b = { title: r.title, byMonth: new Map(), total: 0 };
      perBook.set(r.bookId, b);
    }
    const n = Number(r.issues);
    b.byMonth.set(r.month, n);
    b.total += n;
  }

  // Rank by 6-month volume, keep the top N candidates.
  const last6Keys = Array.from({ length: 6 }, (_, i) => ymKey(monthsAgo(i)));
  const candidates = Array.from(perBook.entries())
    .map(([bookId, b]) => ({
      bookId,
      b,
      recent6: last6Keys.reduce((s, k) => s + (b.byMonth.get(k) ?? 0), 0),
    }))
    .sort((x, y) => y.recent6 - x.recent6 || y.b.total - x.b.total)
    .slice(0, limit);

  const nowMonth = new Date().getMonth(); // 0-based
  const rows: BookDemandForecastRow[] = candidates.map(({ bookId, b }) => {
    const monthsWithData = b.byMonth.size;
    const overallMonthlyAvg = b.total / Math.max(monthsWithData, 1);

    // Recent trend: mean of last 3 months vs the 3 before.
    const last3 = last6Keys
      .slice(0, 3)
      .reduce((s, k) => s + (b.byMonth.get(k) ?? 0), 0);
    const prior3 = last6Keys
      .slice(3, 6)
      .reduce((s, k) => s + (b.byMonth.get(k) ?? 0), 0);
    const recentMonthlyAvg = last3 / 3;
    const ratio = prior3 > 0 ? last3 / prior3 : last3 > 0 ? 2 : 1;
    const trend: BookDemandForecastRow["trend"] =
      ratio > 1.15 ? "up" : ratio < 0.85 ? "down" : "flat";

    // Seasonal index for each forecast month: share of that calendar month in
    // the book's history vs its overall monthly average. Clamped so a single
    // odd month cannot blow the forecast up.
    const seasonalFor = (monthIdx0: number): number => {
      if (monthsWithData < 6) return 1;
      let sum = 0;
      let n = 0;
      for (const [key, v] of b.byMonth) {
        const parts = key.split("-");
        const m = Number(parts[1] ?? 0) - 1;
        if (m === monthIdx0) {
          sum += v;
          n += 1;
        }
      }
      if (n === 0) return 1;
      const idx = sum / n / Math.max(overallMonthlyAvg, 0.01);
      return Math.min(Math.max(idx, 0.25), 4);
    };

    // Forecast = Σ over each (fractional) month in the horizon.
    let predicted = 0;
    let remaining = horizonDays;
    let m = nowMonth;
    while (remaining > 0) {
      const daysThisMonth = Math.min(remaining, 30);
      predicted += recentMonthlyAvg * seasonalFor(m) * (daysThisMonth / 30);
      remaining -= daysThisMonth;
      m = (m + 1) % 12;
    }

    const seasonalIndex = Math.round(seasonalFor(nowMonth) * 100) / 100;
    const confidence: BookDemandForecastRow["confidence"] =
      monthsWithData >= 12 ? "high" : monthsWithData >= 6 ? "medium" : "low";

    return {
      bookId,
      title: b.title,
      recentMonthlyAvg: Math.round(recentMonthlyAvg * 10) / 10,
      seasonalIndex,
      predictedDemand: Math.max(0, Math.round(predicted)),
      trend,
      confidence,
    };
  });

  rows.sort((a, z) => z.predictedDemand - a.predictedDemand);
  return { horizonDays, rows };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Footfall forecast — next 14 days.
// ─────────────────────────────────────────────────────────────────────────────

export type FootfallForecastRow = {
  date: string;
  dayOfWeek: string;
  baseline: number;
  seasonalIndex: number;
  examUplift: number;
  predicted: number;
  isPeak: boolean;
  drivers: string[];
};

export type FootfallForecastPayload = {
  examUpliftFactor: number;
  upcomingExams: Array<{ name: string; commencementDate: string }>;
  rows: FootfallForecastRow[];
};

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export async function getFootfallForecast(
  filters: PredictionFilters,
): Promise<FootfallForecastPayload> {
  const since = monthsAgo(TRAILING_MONTHS);
  const where = compose(
    branchCond(filters.branchId, libraryEntryExitModel.branchId),
    gte(libraryEntryExitModel.entryTimestamp, since),
  );

  const [dailyRaw, examRows] = await Promise.all([
    db
      .select({
        day: sql<string>`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
        entries: count(),
      })
      .from(libraryEntryExitModel)
      .where(where)
      .groupBy(
        sql`TO_CHAR(${libraryEntryExitModel.entryTimestamp}, 'YYYY-MM-DD')`,
      ),
    db
      .select({
        name: examGroupModel.name,
        commencementDate: examGroupModel.examCommencementDate,
      })
      .from(examGroupModel)
      .orderBy(desc(examGroupModel.examCommencementDate)),
  ]);

  const daily = dailyRaw.map((r) => ({
    date: new Date(`${r.day}T12:00:00`),
    entries: Number(r.entries),
  }));

  // Baseline: trimmed mean of the last 8 weeks (drop top/bottom 10% so a
  // one-off event day does not move every forecast).
  const eightWeeksAgo = new Date(Date.now() - 56 * 86400000);
  const recent = daily
    .filter((d) => d.date >= eightWeeksAgo)
    .map((d) => d.entries)
    .sort((a, b) => a - b);
  const trim = Math.floor(recent.length * 0.1);
  const trimmed = recent.slice(trim, recent.length - trim || undefined);
  const baseline =
    trimmed.length > 0
      ? trimmed.reduce((s, v) => s + v, 0) / trimmed.length
      : 0;

  // Seasonality: avg entries per (dow, month) and per dow, vs overall avg.
  const overallAvg =
    daily.length > 0
      ? daily.reduce((s, d) => s + d.entries, 0) / daily.length
      : 0;
  const byDowMonth = new Map<string, { sum: number; n: number }>();
  const byDow = new Map<number, { sum: number; n: number }>();
  for (const d of daily) {
    const dow = d.date.getDay();
    const key = `${dow}-${d.date.getMonth()}`;
    const dm = byDowMonth.get(key) ?? { sum: 0, n: 0 };
    dm.sum += d.entries;
    dm.n += 1;
    byDowMonth.set(key, dm);
    const dd = byDow.get(dow) ?? { sum: 0, n: 0 };
    dd.sum += d.entries;
    dd.n += 1;
    byDow.set(dow, dd);
  }
  const seasonalFor = (date: Date): number => {
    if (overallAvg <= 0) return 1;
    const dow = date.getDay();
    const dm = byDowMonth.get(`${dow}-${date.getMonth()}`);
    if (dm && dm.n >= 3) return dm.sum / dm.n / overallAvg;
    const dd = byDow.get(dow);
    if (dd && dd.n >= 3) return dd.sum / dd.n / overallAvg;
    return 1;
  };

  // Exam uplift: historical footfall in the N days before each past
  // commencement date vs everywhere else.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parseDateOnly = (s: string): Date => new Date(`${s}T12:00:00`);
  const pastExams = examRows.filter(
    (e) => parseDateOnly(e.commencementDate) < today,
  );
  const upcomingExams = examRows
    .filter((e) => parseDateOnly(e.commencementDate) >= today)
    .sort((a, b) => a.commencementDate.localeCompare(b.commencementDate));

  const inPastExamWindow = (d: Date): boolean =>
    pastExams.some((e) => {
      const c = parseDateOnly(e.commencementDate);
      const diff = (c.getTime() - d.getTime()) / 86400000;
      return diff > 0 && diff <= EXAM_WINDOW_DAYS;
    });

  let examUpliftFactor = 1;
  if (pastExams.length >= 2) {
    const inWin: number[] = [];
    const outWin: number[] = [];
    for (const d of daily) {
      (inPastExamWindow(d.date) ? inWin : outWin).push(d.entries);
    }
    const mean = (a: number[]) =>
      a.length > 0 ? a.reduce((s, v) => s + v, 0) / a.length : 0;
    const inMean = mean(inWin);
    const outMean = mean(outWin);
    if (inMean > 0 && outMean > 0) {
      examUpliftFactor = Math.min(Math.max(inMean / outMean, 1), 2.5);
    }
  }
  examUpliftFactor = Math.round(examUpliftFactor * 100) / 100;

  // Forecast the next 14 days.
  const rows: FootfallForecastRow[] = [];
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today.getTime() + i * 86400000);
    const seasonal = seasonalFor(date);
    const drivers: string[] = [];

    let upliftApplied = 1;
    for (const e of upcomingExams) {
      const c = parseDateOnly(e.commencementDate);
      const daysUntil = Math.round((c.getTime() - date.getTime()) / 86400000);
      if (daysUntil > 0 && daysUntil <= EXAM_WINDOW_DAYS) {
        upliftApplied = examUpliftFactor;
        drivers.push(`Exam: ${e.name} in ${daysUntil}d`);
        break;
      }
    }
    if (date.getDay() === 0) drivers.push("Sunday low");
    else if (seasonal < 0.75) drivers.push("Historically quiet");
    else if (seasonal > 1.25) drivers.push("Historically busy");

    const predicted = Math.max(
      0,
      Math.round(baseline * seasonal * upliftApplied),
    );
    rows.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      dayOfWeek: DOW_NAMES[date.getDay()] ?? "",
      baseline: Math.round(baseline),
      seasonalIndex: Math.round(seasonal * 100) / 100,
      examUplift: upliftApplied,
      predicted,
      isPeak: baseline > 0 && predicted >= 1.3 * baseline,
      drivers,
    });
  }

  return {
    examUpliftFactor,
    upcomingExams: upcomingExams.slice(0, 5).map((e) => ({
      name: e.name,
      commencementDate: e.commencementDate,
    })),
    rows,
  };
}
