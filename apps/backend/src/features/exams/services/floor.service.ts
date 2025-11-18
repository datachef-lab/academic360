import { db } from "@/db/index.js";
import {
  Floor,
  FloorT,
  floorModel,
  roomModel,
} from "@repo/db/schemas/models/exams";
import { and, countDistinct, eq, ilike, ne, sql } from "drizzle-orm";

function normaliseFloorPayload<T extends Partial<Floor | FloorT>>(data: T) {
  const clone = { ...data };
  if (clone.name && typeof clone.name === "string") {
    clone.name = clone.name.trim() as T["name"];
  }
  if (
    clone.shortName !== undefined &&
    typeof clone.shortName === "string" &&
    clone.shortName !== null
  ) {
    clone.shortName = clone.shortName.trim() as T["shortName"];
  }
  return clone;
}

async function ensureUniqueName(
  name: string,
  excludeId?: number,
): Promise<boolean> {
  const trimmedName = name.trim();
  const whereClause =
    excludeId !== undefined
      ? and(ilike(floorModel.name, trimmedName), ne(floorModel.id, excludeId))
      : ilike(floorModel.name, trimmedName);

  const [existing] = await db.select().from(floorModel).where(whereClause);
  return Boolean(existing);
}

async function ensureUniqueSequence(
  sequence: number | null | undefined,
  excludeId?: number,
): Promise<boolean> {
  if (sequence === undefined || sequence === null) return false;
  const whereClause =
    excludeId !== undefined
      ? and(eq(floorModel.sequence, sequence), ne(floorModel.id, excludeId))
      : eq(floorModel.sequence, sequence);
  const [existing] = await db.select().from(floorModel).where(whereClause);
  return Boolean(existing);
}

export async function createFloor(data: Floor) {
  const { id, createdAt, updatedAt, ...rest } = data as FloorT;
  const payload = normaliseFloorPayload(rest);

  if (!payload.name) {
    throw new Error("Floor name is required.");
  }

  if (await ensureUniqueName(payload.name)) {
    throw new Error("Floor name already exists.");
  }

  if (await ensureUniqueSequence(payload.sequence ?? null)) {
    throw new Error("Sequence must be unique.");
  }

  const [created] = await db.insert(floorModel).values(payload).returning();
  return created;
}

export async function getAllFloors() {
  return db.select().from(floorModel);
}

export async function findFloorById(id: number) {
  const [floor] = await db
    .select()
    .from(floorModel)
    .where(eq(floorModel.id, id));
  return floor ?? null;
}

export async function updateFloor(
  id: number,
  data: Partial<FloorT> | Partial<Floor>,
) {
  const { id: _, createdAt, updatedAt, ...rest } = data as Partial<FloorT>;
  const payload = normaliseFloorPayload(rest);

  if (payload.name && (await ensureUniqueName(payload.name, id))) {
    throw new Error("Floor name already exists.");
  }

  if (
    payload.sequence !== undefined &&
    (await ensureUniqueSequence(payload.sequence, id))
  ) {
    throw new Error("Sequence must be unique.");
  }

  const [updated] = await db
    .update(floorModel)
    .set(payload)
    .where(eq(floorModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteFloor(id: number) {
  const [deleted] = await db
    .delete(floorModel)
    .where(eq(floorModel.id, id))
    .returning();
  return deleted ?? null;
}

export async function deleteFloorSafe(id: number) {
  const [found] = await db
    .select()
    .from(floorModel)
    .where(eq(floorModel.id, id));
  if (!found) return null;

  const [{ roomCount }] = await db
    .select({ roomCount: countDistinct(roomModel.id) })
    .from(roomModel)
    .where(eq(roomModel.floorId, id));

  if (roomCount > 0) {
    return {
      success: false,
      message: "Cannot delete floor. It is associated with rooms.",
      records: [{ count: roomCount, type: "Room" }],
    };
  }

  const [deleted] = await db
    .delete(floorModel)
    .where(eq(floorModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Floor deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete floor.",
    records: [],
  };
}
