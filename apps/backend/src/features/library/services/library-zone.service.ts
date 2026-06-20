import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { libraryZoneModel } from "@repo/db/schemas/models/library/library-zone.model.js";
import { libraryGateEventModel } from "@repo/db/schemas/models/library/library-gate-event.model.js";
import { assertUniqueLibraryName } from "@/features/library/services/_assert-unique.js";

export type ZoneListFilters = {
  page: number;
  limit: number;
  search?: string;
  branchId?: number;
  isActive?: boolean;
};

export type ZoneRow = {
  id: number;
  branchId: number | null;
  name: string;
  code: string | null;
  description: string | null;
  capacity: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ZoneUpsertInput = {
  branchId?: number | null;
  name: string;
  code?: string | null;
  description?: string | null;
  capacity?: number | null;
  isActive?: boolean;
};

const COLS = {
  id: libraryZoneModel.id,
  branchId: libraryZoneModel.branchId,
  name: libraryZoneModel.name,
  code: libraryZoneModel.code,
  description: libraryZoneModel.description,
  capacity: libraryZoneModel.capacity,
  isActive: libraryZoneModel.isActive,
  createdAt: libraryZoneModel.createdAt,
  updatedAt: libraryZoneModel.updatedAt,
};

const buildWhere = (
  f: Omit<ZoneListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (f.search?.trim()) {
    const term = `%${f.search.trim()}%`;
    const p = or(
      ilike(libraryZoneModel.name, term),
      ilike(libraryZoneModel.code, term),
    );
    if (p) parts.push(p);
  }
  if (f.branchId != null) parts.push(eq(libraryZoneModel.branchId, f.branchId));
  if (f.isActive != null) parts.push(eq(libraryZoneModel.isActive, f.isActive));
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findZonesPaginated(filters: ZoneListFilters) {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildWhere(rest);
  const [{ total }] = await db
    .select({ total: count() })
    .from(libraryZoneModel)
    .where(whereClause);
  const rows = await db
    .select(COLS)
    .from(libraryZoneModel)
    .where(whereClause)
    .orderBy(desc(libraryZoneModel.id))
    .limit(limit)
    .offset(offset);
  return { rows, total, page, limit };
}

export async function getZoneById(id: number) {
  const [row] = await db
    .select(COLS)
    .from(libraryZoneModel)
    .where(eq(libraryZoneModel.id, id))
    .limit(1);
  return row ?? null;
}

const normalize = (input: ZoneUpsertInput) => ({
  branchId: input.branchId ?? null,
  name: input.name.trim(),
  code: input.code?.trim() ? input.code.trim() : null,
  description: input.description?.trim() ? input.description.trim() : null,
  capacity: input.capacity ?? null,
  isActive: input.isActive ?? true,
});

export async function createZone(input: ZoneUpsertInput) {
  await assertUniqueLibraryName({
    table: libraryZoneModel,
    nameColumn: libraryZoneModel.name,
    idColumn: libraryZoneModel.id,
    value: input.name,
    label: "Zone",
  });
  const [r] = await db
    .insert(libraryZoneModel)
    .values(normalize(input))
    .returning({ id: libraryZoneModel.id });
  return r.id;
}

export async function updateZone(id: number, input: ZoneUpsertInput) {
  await assertUniqueLibraryName({
    table: libraryZoneModel,
    nameColumn: libraryZoneModel.name,
    idColumn: libraryZoneModel.id,
    value: input.name,
    label: "Zone",
    excludeId: id,
  });
  await db
    .update(libraryZoneModel)
    .set({ ...normalize(input), updatedAt: new Date() })
    .where(eq(libraryZoneModel.id, id));
}

export async function deleteZone(id: number) {
  await db.delete(libraryZoneModel).where(eq(libraryZoneModel.id, id));
}

export async function listGateEvents(filters: {
  page: number;
  limit: number;
  branchId?: number;
  eventType?: string;
}) {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const parts: SQL[] = [];
  if (rest.branchId != null)
    parts.push(eq(libraryGateEventModel.branchId, rest.branchId));
  if (rest.eventType)
    parts.push(eq(libraryGateEventModel.eventType, rest.eventType));
  const whereClause =
    parts.length === 0
      ? undefined
      : parts.length === 1
        ? parts[0]
        : and(...parts);
  const [{ total }] = await db
    .select({ total: count() })
    .from(libraryGateEventModel)
    .where(whereClause);
  const rows = await db
    .select({
      id: libraryGateEventModel.id,
      branchId: libraryGateEventModel.branchId,
      gateIdentifier: libraryGateEventModel.gateIdentifier,
      eventType: libraryGateEventModel.eventType,
      rfidNumber: libraryGateEventModel.rfidNumber,
      copyDetailsId: libraryGateEventModel.copyDetailsId,
      userId: libraryGateEventModel.userId,
      capturedImageUrl: libraryGateEventModel.capturedImageUrl,
      remarks: libraryGateEventModel.remarks,
      occurredAt: libraryGateEventModel.occurredAt,
    })
    .from(libraryGateEventModel)
    .where(whereClause)
    .orderBy(desc(libraryGateEventModel.occurredAt))
    .limit(limit)
    .offset(offset);
  return { rows, total, page, limit };
}

export async function recordGateEvent(input: {
  branchId?: number | null;
  zoneId?: number | null;
  gateIdentifier?: string | null;
  eventType: string;
  rfidNumber?: string | null;
  copyDetailsId?: number | null;
  userId?: number | null;
  capturedImageUrl?: string | null;
  remarks?: string | null;
}) {
  if (!input.eventType?.trim()) {
    throw new ApiError(400, "eventType is required.");
  }
  const [r] = await db
    .insert(libraryGateEventModel)
    .values({
      branchId: input.branchId ?? null,
      zoneId: input.zoneId ?? null,
      gateIdentifier: input.gateIdentifier?.trim() || null,
      eventType: input.eventType.trim(),
      rfidNumber: input.rfidNumber?.trim() || null,
      copyDetailsId: input.copyDetailsId ?? null,
      userId: input.userId ?? null,
      capturedImageUrl: input.capturedImageUrl?.trim() || null,
      remarks: input.remarks?.trim() || null,
    })
    .returning({ id: libraryGateEventModel.id });
  return r.id;
}
