// Shared scope-resolver: derives the legacy→new class map dynamically from new-DB papers coverage.
// "In scope" = a legacy class whose name matches a new-DB class that has at least one paper row.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { classModel, paperModel } from "@repo/db/schemas/models";

export type ScopeResult = {
  classMap: Record<number, number>; // legacy class id -> new class id
  legacyClassIds: number[]; // sorted; for SQL IN(...)
  newClassIds: number[]; // sorted; new ids
  maxNewClassId: number;
};

function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s_]+/g, " ")
    .trim();
}

export async function resolveSubjectSelectionScope(
  legacyPool: import("mysql2/promise").Pool,
): Promise<ScopeResult> {
  const rowsMax = await db
    .select({ maxClassId: sql<number>`MAX(${paperModel.classId})` })
    .from(paperModel);
  const maxNewClassId = Number(rowsMax[0]?.maxClassId ?? 0);
  if (!maxNewClassId) {
    return {
      classMap: {},
      legacyClassIds: [],
      newClassIds: [],
      maxNewClassId: 0,
    };
  }

  // All new classes up to max with papers
  const newClasses = await db.select().from(classModel);
  const newIn = newClasses.filter((c) => c.id! <= maxNewClassId);

  // Legacy classes (read-only)
  const [legacyRows]: any = await legacyPool.query(
    "SELECT id, className FROM classes",
  );

  // Match new name (e.g. "SEMESTER I") to legacy className (e.g. "Semester I")
  const map: Record<number, number> = {};
  for (const nc of newIn) {
    const ncName = normName(nc.name ?? "");
    const hit = legacyRows.find(
      (lr: any) => normName(String(lr.className)) === ncName,
    );
    if (hit) map[Number(hit.id)] = nc.id!;
  }
  const legacyClassIds = Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b);
  const newClassIds = legacyClassIds.map((l) => map[l]).sort((a, b) => a - b);
  return { classMap: map, legacyClassIds, newClassIds, maxNewClassId };
}
