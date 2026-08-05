/**
 * Footfall forecast — 14-day horizon. Three sheets: summary, upcoming exams,
 * day-by-day estimate. All numeric values are integers per product ask
 * (multipliers rounded to the nearest whole number — losing the fractional
 * "20% swing" nuance is a deliberate trade for readability).
 */

import { getFootfallForecast } from "../library-prediction-reports.service.js";
import { buildStandardWorkbook } from "../report-common/build-standard-workbook.js";
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";
import { formatIstDate } from "@/utils/format-datetime.js";

export async function exportFootfallForecastExcel(
  f: LibraryReportFilters,
): Promise<Buffer> {
  const result = await getFootfallForecast({ branchId: f.branchId });

  const baselineAvg =
    result.rows.length > 0
      ? Math.round(
          result.rows.reduce((s, r) => s + r.baseline, 0) / result.rows.length,
        )
      : 0;

  const summaryRows = [
    { Metric: "Normal visits per day", Value: baselineAvg },
    {
      Metric: "Exam-time boost (extra visits × factor)",
      Value: Math.round(result.examUpliftFactor),
    },
    {
      Metric: "Reminder",
      Value:
        "These numbers are an ESTIMATE for the next 14 days, not a guarantee. Normal visits per day = trimmed mean of daily entries over the last 8 weeks. Exam-time boost = historical ratio of visits in the 14 days before an exam vs other days.",
    },
  ];

  const examRows = result.upcomingExams.map((e) => {
    const daysUntil = Math.max(
      0,
      Math.round(
        (new Date(e.commencementDate).getTime() - Date.now()) / 86_400_000,
      ),
    );
    return {
      Exam: e.name,
      "Commencement date": formatIstDate(e.commencementDate),
      "Days until": daysUntil,
    };
  });

  const forecastRows = result.rows.map((r) => ({
    Date: formatIstDate(r.date),
    "Day of week": r.dayOfWeek,
    "Estimated visits": Math.round(r.predicted),
    "Normal visits per day": Math.round(r.baseline),
    "Day / month factor": Math.round(r.seasonalIndex),
    "Exam-time boost": Math.round(r.examUplift),
    "Busy day?": r.isPeak ? "Yes" : "",
    Why: r.drivers.join("; "),
  }));

  return buildStandardWorkbook([
    {
      name: "Summary",
      columns: [
        { header: "Metric", key: "Metric", width: 40 },
        { header: "Value", key: "Value", width: 60 },
      ],
      rows: summaryRows,
    },
    {
      name: "Upcoming exams considered",
      columns: [
        { header: "Exam", key: "Exam", width: 40 },
        { header: "Commencement date", key: "Commencement date", width: 22 },
        { header: "Days until", key: "Days until", width: 14 },
      ],
      rows: examRows,
    },
    {
      name: "Day-by-day estimate",
      intro: [
        "These are ESTIMATES for the next 14 days, not a guarantee.",
        "How each row is calculated: Estimated visits = Normal visits per day × Day/month factor × Exam-time boost (only when the date is in the 14 days before an upcoming exam).",
        "Busy day? = Yes when the estimate is 30% or more above the normal.",
      ],
      columns: [
        { header: "Date", key: "Date", width: 14 },
        { header: "Day of week", key: "Day of week", width: 14 },
        { header: "Estimated visits", key: "Estimated visits", width: 18 },
        {
          header: "Normal visits per day",
          key: "Normal visits per day",
          width: 22,
        },
        { header: "Day / month factor", key: "Day / month factor", width: 18 },
        { header: "Exam-time boost", key: "Exam-time boost", width: 18 },
        { header: "Busy day?", key: "Busy day?", width: 12 },
        { header: "Why", key: "Why", width: 40 },
      ],
      rows: forecastRows,
    },
  ]);
}
