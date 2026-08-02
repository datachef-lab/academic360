/**
 * Book demand forecast — 30-day horizon per title.
 * Uses the existing statistical service in library-prediction-reports.service
 * and enriches each row with the shared Book info block.
 */

import { getBookDemandForecast } from "../library-prediction-reports.service.js";
import { buildStandardWorkbook } from "../report-common/build-standard-workbook.js";
import {
  BOOK_COLUMN_DEFS,
  bookContextRow,
  enrichBooksForReport,
} from "../report-common/enrich-books.js";
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";

const TREND_LABEL: Record<string, string> = {
  up: "Going up",
  flat: "Steady",
  down: "Going down",
};
const CONFIDENCE_LABEL: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low — sparse history",
};

export async function exportBookDemandForecastExcel(
  f: LibraryReportFilters,
): Promise<Buffer> {
  const result = await getBookDemandForecast(
    { branchId: f.branchId },
    { horizonDays: 30, limit: 100 },
  );
  const bookMap = await enrichBooksForReport(result.rows.map((r) => r.bookId));

  const rows = result.rows.map((r, i) => ({
    "Sr No": i + 1,
    "Book title": bookMap.get(r.bookId)?.title ?? "",
    "Estimated issues in the next 30 days": Math.round(r.predictedDemand),
    "Recent trend": TREND_LABEL[r.trend] ?? r.trend,
    "Reliability of this estimate":
      CONFIDENCE_LABEL[r.confidence] ?? r.confidence,
    // Average issues per month can legitimately be < 1 (e.g. 0.4/month is
    // meaningful for slow-turnover titles), so keep 1 decimal instead of
    // rounding to integer.
    "Average issues per month": Math.round(r.recentMonthlyAvg * 10) / 10,
    // Seasonal-index is a multiplier (0.25..4.00). Round to 2 decimals so a
    // 1.20 (20% swing) doesn't get lost to integer rounding.
    "Time-of-year factor": Math.round(r.seasonalIndex * 100) / 100,
    ...bookContextRow(bookMap.get(r.bookId)),
  }));

  return buildStandardWorkbook([
    {
      name: "Estimated demand (30 days)",
      intro: [
        "These numbers are an ESTIMATE for the next 30 days, not a guarantee.",
        "How it's calculated: for each title we take its average issues per month over the last 3 months, multiply by the same-month share of historical issues (Adjustment for time of year), and sum across the 30-day window.",
        "How confident is this estimate = High / Medium / Low based on how many months of history we have for the title. Titles with under 6 months of history are always marked Low.",
      ],
      columns: [
        { header: "Sr No", key: "Sr No", width: 8 },
        { header: "Book title", key: "Book title", width: 34 },
        {
          header: "Estimated issues in the next 30 days",
          key: "Estimated issues in the next 30 days",
          width: 40,
        },
        {
          header: "Recent trend",
          key: "Recent trend",
          width: 26,
        },
        {
          header: "Reliability of this estimate",
          key: "Reliability of this estimate",
          width: 28,
        },
        {
          header: "Average issues per month",
          key: "Average issues per month",
          width: 32,
        },
        {
          header: "Time-of-year factor",
          key: "Time-of-year factor",
          width: 24,
        },
        ...BOOK_COLUMN_DEFS.filter((c) => c.key !== "Book title"),
      ],
      rows,
      // Book context block already includes Price (INR) — highlight it as
      // money too so the amount column is visually distinct.
      moneyKeys: ["Price (INR)"],
    },
  ]);
}
