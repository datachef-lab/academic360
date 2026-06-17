/**
 * Library Digital Twin v1 — 2D floor plan storage + inventory overlay.
 *
 * Stores a flat JSON layout per (branch × name) describing rack rectangles on
 * a grid. The `getFloorPlanWithInventory` endpoint enriches each rack with the
 * current copy count + recent gate-event count so the viewer can colour-code
 * "hot" zones.
 */

import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, eq, gte } from "drizzle-orm";
import {
  floorPlanModel,
  type FloorPlanLayout,
} from "@repo/db/schemas/models/library/floor-plan.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { libraryGateEventModel } from "@repo/db/schemas/models/library/library-gate-event.model.js";

export async function listFloorPlans(branchId?: number) {
  const where =
    branchId != null ? eq(floorPlanModel.branchId, branchId) : undefined;
  const rows = await db
    .select({
      id: floorPlanModel.id,
      branchId: floorPlanModel.branchId,
      name: floorPlanModel.name,
      updatedAt: floorPlanModel.updatedAt,
    })
    .from(floorPlanModel)
    .where(where);
  return rows;
}

export async function getFloorPlan(id: number) {
  const [row] = await db
    .select()
    .from(floorPlanModel)
    .where(eq(floorPlanModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function saveFloorPlan(input: {
  id?: number;
  branchId: number;
  name: string;
  layout: FloorPlanLayout;
}) {
  if (!input.name?.trim()) throw new ApiError(400, "name is required");
  if (!input.layout || !Array.isArray(input.layout.racks)) {
    throw new ApiError(400, "layout.racks must be an array");
  }
  if (input.id) {
    await db
      .update(floorPlanModel)
      .set({
        name: input.name.trim(),
        layout: input.layout,
        updatedAt: new Date(),
      })
      .where(eq(floorPlanModel.id, input.id));
    return input.id;
  }
  const [r] = await db
    .insert(floorPlanModel)
    .values({
      branchId: input.branchId,
      name: input.name.trim(),
      layout: input.layout,
    })
    .returning({ id: floorPlanModel.id });
  return r.id;
}

export type FloorPlanWithInventory = {
  id: number;
  branchId: number;
  name: string;
  layout: FloorPlanLayout & {
    racks: Array<
      FloorPlanLayout["racks"][number] & {
        copyCount: number;
        recentGateEvents: number;
      }
    >;
  };
};

export async function getFloorPlanWithInventory(
  id: number,
): Promise<FloorPlanWithInventory | null> {
  const plan = await getFloorPlan(id);
  if (!plan) return null;
  const layout = plan.layout as FloorPlanLayout;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const enriched: FloorPlanWithInventory["layout"]["racks"] = [];
  for (const r of layout.racks ?? []) {
    let copyCount = 0;
    let recentGateEvents = 0;
    if (r.rackId != null) {
      const [{ c }] = await db
        .select({ c: count() })
        .from(copyDetailsModel)
        .where(eq(copyDetailsModel.rackId, r.rackId));
      copyCount = Number(c ?? 0);
      // Gate events today scoped to this branch — best-effort proxy for "is
      // there foot traffic here" until per-rack RFID antennas are wired.
      const [{ c: gc }] = await db
        .select({ c: count() })
        .from(libraryGateEventModel)
        .where(
          and(
            eq(libraryGateEventModel.branchId, plan.branchId),
            gte(libraryGateEventModel.occurredAt, todayStart),
          ),
        );
      recentGateEvents = Number(gc ?? 0);
    }
    enriched.push({ ...r, copyCount, recentGateEvents });
  }
  return {
    id: plan.id,
    branchId: plan.branchId,
    name: plan.name,
    layout: { ...layout, racks: enriched },
  };
}

export async function deleteFloorPlan(id: number) {
  await db.delete(floorPlanModel).where(eq(floorPlanModel.id, id));
}
