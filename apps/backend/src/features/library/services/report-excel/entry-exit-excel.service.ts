/**
 * Entry / Exit footfall list — extended version of the existing entry/exit
 * page's Download Report (apps/backend/.../library-entry-exit.service.ts).
 * Includes the same 22 columns of user context plus Patron category /
 * Community / Gender, and applies the wide LibraryReportFilters (branch,
 * date range, batch narrowers, user attributes, zone).
 *
 * Sheet 2 rolls the raw entries up into a per-day summary.
 */

import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { buildStandardWorkbook } from "../report-common/build-standard-workbook.js";
import {
  USER_COLUMN_DEFS,
  enrichUsersForReport,
  userContextRow,
} from "../report-common/enrich-users.js";
import {
  buildUserAndBatchJoin,
  buildUserAndBatchWhere,
  composeWhere,
} from "../report-common/user-and-batch-where.js";
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";
import { formatIstDateTime } from "@/utils/format-datetime.js";
import { formatIntIN } from "@/utils/format-inr.js";

const ROW_CAP = 30_000;

const fmtDT = formatIstDateTime;

export async function exportEntryExitExcel(
  f: LibraryReportFilters,
): Promise<Buffer> {
  const eventTs = sql`e.entry_timestamp`;
  const joins = buildUserAndBatchJoin("library_entry_exit", eventTs);
  const wheres = [
    ...buildUserAndBatchWhere(f),
    f.dateFrom ? sql`e.entry_timestamp >= ${f.dateFrom}` : null,
    f.dateTo ? sql`e.entry_timestamp <= ${f.dateTo}` : null,
    f.zoneIds && f.zoneIds.length > 0
      ? sql`e.zone_id_fk IN (${sql.join(
          f.zoneIds.map((n) => sql`${n}`),
          sql`, `,
        )})`
      : null,
  ];

  const rowsRaw = (
    await db.execute(sql`
      SELECT
        e.id                 AS entry_exit_id,
        e.user_id_fk         AS user_id,
        e.current_status     AS current_status,
        e.entry_timestamp    AS entry_at,
        e.exit_timestamp     AS exit_at
      ${joins}
      ${composeWhere(wheres)}
      ORDER BY e.id DESC
      LIMIT ${ROW_CAP}
    `)
  ).rows as Array<{
    entry_exit_id: number;
    user_id: number;
    current_status: string | null;
    entry_at: Date | null;
    exit_at: Date | null;
  }>;

  const userMap = await enrichUsersForReport(rowsRaw.map((r) => r.user_id));

  const sheet1Rows = rowsRaw.map((r, i) => ({
    "Sr No": i + 1,
    "Entry time": fmtDT(r.entry_at),
    "Exit time": fmtDT(r.exit_at),
    "Current status":
      r.current_status === "CHECKED_IN"
        ? "Checked in"
        : r.current_status === "CHECKED_OUT"
          ? "Checked out"
          : (r.current_status ?? ""),
    ...userContextRow(userMap.get(r.user_id)),
    "Entry/Exit ID": r.entry_exit_id,
  }));

  // Aggregated sheets (independent of the 30k row-cap on sheet 1).
  const [dailyRaw, enteredByHourRaw, exitedByHourRaw, byZoneRaw] =
    await Promise.all([
      db.execute(sql`
      SELECT
        TO_CHAR(e.entry_timestamp, 'YYYY-MM-DD') AS day,
        COUNT(*)::int                            AS entries,
        COUNT(DISTINCT e.user_id_fk)::int        AS different_visitors,
        COALESCE(
          AVG(EXTRACT(EPOCH FROM (e.exit_timestamp - e.entry_timestamp)) / 60)
            FILTER (WHERE e.exit_timestamp IS NOT NULL),
          0
        )::int                                   AS avg_time_minutes,
        MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM e.entry_timestamp))::int AS busiest_hour
      ${joins}
      ${composeWhere(wheres)}
      GROUP BY TO_CHAR(e.entry_timestamp, 'YYYY-MM-DD')
      ORDER BY day DESC
      LIMIT 400
    `),
      // Entries per hour of day.
      db.execute(sql`
      SELECT EXTRACT(HOUR FROM e.entry_timestamp)::int AS hour,
             COUNT(*)::int                             AS entered
      ${joins}
      ${composeWhere(wheres)}
      GROUP BY EXTRACT(HOUR FROM e.entry_timestamp)
      ORDER BY hour
    `),
      // Exits per hour of day (separate query so a matching event with a NULL
      // exit_timestamp doesn't inflate the entries count).
      db.execute(sql`
      SELECT EXTRACT(HOUR FROM e.exit_timestamp)::int AS hour,
             COUNT(*)::int                            AS exited
      ${joins}
      ${composeWhere([...wheres, sql`e.exit_timestamp IS NOT NULL`])}
      GROUP BY EXTRACT(HOUR FROM e.exit_timestamp)
      ORDER BY hour
    `),
      db.execute(sql`
      SELECT e.zone_id_fk                     AS zone_id,
             COALESCE(zones.name, '') AS zone_name,
             COUNT(*)::int                    AS entries
      ${joins}
      LEFT JOIN library_zones zones ON zones.id = e.zone_id_fk
      ${composeWhere(wheres)}
      GROUP BY e.zone_id_fk, zones.name
      ORDER BY entries DESC
    `),
    ]);

  // Format a 24-hour clock number as `hh:00 AM/PM` in en-IN style.
  const fmtHour = (h: number): string => {
    const meridiem = h < 12 ? "AM" : "PM";
    const twelve = ((h + 11) % 12) + 1; // 0→12, 13→1, etc.
    return `${String(twelve).padStart(2, "0")}:00 ${meridiem}`;
  };

  const dailyRows = (
    dailyRaw.rows as Array<{
      day: string;
      entries: number;
      different_visitors: number;
      avg_time_minutes: number;
      busiest_hour: number | null;
    }>
  ).map((r) => ({
    Date: r.day,
    "Number of entries": formatIntIN(r.entries),
    "How many different students visited": formatIntIN(r.different_visitors),
    "Average time in library (minutes)": formatIntIN(r.avg_time_minutes),
    "Busiest hour": r.busiest_hour != null ? fmtHour(r.busiest_hour) : "",
  }));

  // Merge entered + exited hour buckets so each row shows both counts side-by-side.
  const entriesMap = new Map<number, number>(
    (enteredByHourRaw.rows as Array<{ hour: number; entered: number }>).map(
      (r) => [Number(r.hour), Number(r.entered)],
    ),
  );
  const exitsMap = new Map<number, number>(
    (exitedByHourRaw.rows as Array<{ hour: number; exited: number }>).map(
      (r) => [Number(r.hour), Number(r.exited)],
    ),
  );
  const hourKeys = Array.from(
    new Set([...entriesMap.keys(), ...exitsMap.keys()]),
  ).sort((a, b) => a - b);
  const byHourRows = hourKeys.map((h) => ({
    "Hour of day": fmtHour(h),
    "Number of entries": formatIntIN(entriesMap.get(h) ?? 0),
    "Number of exits": formatIntIN(exitsMap.get(h) ?? 0),
  }));

  const byZoneRows = (
    byZoneRaw.rows as Array<{
      zone_id: number | null;
      zone_name: string;
      entries: number;
    }>
  ).map((r) => ({
    Zone: r.zone_name,
    "Number of entries": formatIntIN(r.entries),
  }));

  return buildStandardWorkbook([
    {
      name: "All entries and exits",
      columns: [
        { header: "Sr No", key: "Sr No", width: 8 },
        // Time + status lead so the reader can scan chronologically.
        { header: "Entry time", key: "Entry time", width: 22 },
        { header: "Exit time", key: "Exit time", width: 22 },
        { header: "Current status", key: "Current status", width: 14 },
        ...USER_COLUMN_DEFS,
        { header: "Entry/Exit ID", key: "Entry/Exit ID", width: 14 },
      ],
      rows: sheet1Rows,
    },
    {
      name: "Daily summary",
      columns: [
        { header: "Date", key: "Date", width: 12 },
        { header: "Number of entries", key: "Number of entries", width: 16 },
        {
          header: "How many different students visited",
          key: "How many different students visited",
          width: 30,
        },
        {
          header: "Average time in library (minutes)",
          key: "Average time in library (minutes)",
          width: 28,
        },
        { header: "Busiest hour", key: "Busiest hour", width: 14 },
      ],
      rows: dailyRows,
    },
    {
      name: "By hour of day",
      columns: [
        { header: "Hour of day", key: "Hour of day", width: 16 },
        { header: "Number of entries", key: "Number of entries", width: 20 },
        { header: "Number of exits", key: "Number of exits", width: 20 },
      ],
      rows: byHourRows,
    },
    {
      name: "By zone",
      columns: [
        { header: "Zone", key: "Zone", width: 24 },
        { header: "Number of entries", key: "Number of entries", width: 18 },
      ],
      rows: byZoneRows,
    },
  ]);
}
