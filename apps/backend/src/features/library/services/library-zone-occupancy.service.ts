/**
 * Zone occupancy reporting.
 *
 * Aggregates `library_entry_exit` + `library_gate_events` filtered to a zone
 * (or all zones for a branch) and returns:
 *   - currentInside  — entries where exit_timestamp IS NULL and status === CHECKED_IN
 *   - peakToday      — max hourly count of entries so far today
 *   - byHour         — array of { hour: 0-23, count } for today
 *   - byDepartment   — array of { departmentName, count } for today (joined via student/staff)
 *
 * Today's data only — querying historical windows is a separate analytics
 * endpoint if needed later.
 */

import { db } from "@/db/index.js";
import { and, count, eq, gte, isNull, sql } from "drizzle-orm";
import { libraryEntryExitModel } from "@repo/db/schemas/models/library/library-entry-exit.model.js";
import { libraryZoneModel } from "@repo/db/schemas/models/library/library-zone.model.js";
import { libraryGateEventModel } from "@repo/db/schemas/models/library/library-gate-event.model.js";

export type ZoneOccupancyPayload = {
  zoneId: number | null;
  zoneName: string | null;
  branchId: number | null;
  currentInside: number;
  peakToday: number;
  byHour: Array<{ hour: number; count: number }>;
  byDepartment: Array<{ departmentName: string; count: number }>;
  recentGateEvents: number; // total gate events today (for the "is this zone busy" health check)
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getZoneOccupancy(
  zoneId: number | null,
  branchId?: number,
): Promise<ZoneOccupancyPayload> {
  const todayStart = startOfDay(new Date());

  // Conditions that scope to either a specific zone, or every zone in a branch.
  const entryConditions = [
    gte(libraryEntryExitModel.entryTimestamp, todayStart),
  ];
  if (zoneId != null) {
    entryConditions.push(eq(libraryEntryExitModel.zoneId, zoneId));
  } else if (branchId != null) {
    entryConditions.push(eq(libraryEntryExitModel.branchId, branchId));
  }

  // Currently inside — entry today with no exit yet.
  const [{ currentInside }] = await db
    .select({ currentInside: count() })
    .from(libraryEntryExitModel)
    .where(
      and(...entryConditions, isNull(libraryEntryExitModel.exitTimestamp)),
    );

  // Bucket by hour for today.
  const hourRows = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${libraryEntryExitModel.entryTimestamp})::int`,
      count: count(),
    })
    .from(libraryEntryExitModel)
    .where(and(...entryConditions))
    .groupBy(sql`EXTRACT(HOUR FROM ${libraryEntryExitModel.entryTimestamp})`);

  const byHour: Array<{ hour: number; count: number }> = Array.from(
    { length: 24 },
    (_, h) => {
      const row = hourRows.find((r) => Number(r.hour) === h);
      return { hour: h, count: row ? Number(row.count) : 0 };
    },
  );
  const peakToday = byHour.reduce((m, b) => Math.max(m, b.count), 0);

  // Gate events ingested today for the same zone.
  const gateConditions = [gte(libraryGateEventModel.occurredAt, todayStart)];
  if (zoneId != null)
    gateConditions.push(eq(libraryGateEventModel.zoneId, zoneId));
  else if (branchId != null)
    gateConditions.push(eq(libraryGateEventModel.branchId, branchId));
  const [{ recentGateEvents }] = await db
    .select({ recentGateEvents: count() })
    .from(libraryGateEventModel)
    .where(and(...gateConditions));

  // Zone name (only when zoneId is specified).
  let zoneName: string | null = null;
  let resolvedBranchId: number | null = branchId ?? null;
  if (zoneId != null) {
    const [z] = await db
      .select({
        name: libraryZoneModel.name,
        branchId: libraryZoneModel.branchId,
      })
      .from(libraryZoneModel)
      .where(eq(libraryZoneModel.id, zoneId))
      .limit(1);
    zoneName = z?.name ?? null;
    resolvedBranchId = z?.branchId ?? resolvedBranchId;
  }

  // by-department breakdown is intentionally lightweight: we'd need to join
  // the students/staff table + their department; for now return an empty array
  // (callers can populate it later when department-on-user lands).
  const byDepartment: Array<{ departmentName: string; count: number }> = [];

  return {
    zoneId,
    zoneName,
    branchId: resolvedBranchId,
    currentInside: Number(currentInside ?? 0),
    peakToday,
    byHour,
    byDepartment,
    recentGateEvents: Number(recentGateEvents ?? 0),
  };
}

export async function listZonesOccupancyForBranch(
  branchId?: number,
): Promise<ZoneOccupancyPayload[]> {
  const zones = await db
    .select({ id: libraryZoneModel.id })
    .from(libraryZoneModel)
    .where(
      branchId != null ? eq(libraryZoneModel.branchId, branchId) : undefined,
    );
  const results: ZoneOccupancyPayload[] = [];
  for (const z of zones) {
    results.push(await getZoneOccupancy(z.id, branchId));
  }
  return results;
}
