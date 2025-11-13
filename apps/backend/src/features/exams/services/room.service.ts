import { db } from "@/db/index.js";
import {
  Room,
  RoomT,
  roomModel,
  floorModel,
} from "@repo/db/schemas/models/exams";
import { and, eq, ilike, ne } from "drizzle-orm";

function normaliseRoomPayload<T extends Partial<Room | RoomT>>(data: T) {
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
      ? and(ilike(roomModel.name, trimmedName), ne(roomModel.id, excludeId))
      : ilike(roomModel.name, trimmedName);

  const [existing] = await db.select().from(roomModel).where(whereClause);
  return Boolean(existing);
}

async function validateFloorExists(
  floorId: number | null | undefined,
): Promise<boolean> {
  if (floorId === undefined || floorId === null) return true; // Optional field
  const [floor] = await db
    .select()
    .from(floorModel)
    .where(eq(floorModel.id, floorId));
  return Boolean(floor);
}

export async function createRoom(data: Room) {
  const { id, createdAt, updatedAt, ...rest } = data as RoomT;
  const payload = normaliseRoomPayload(rest);

  if (!payload.name) {
    throw new Error("Room name is required.");
  }

  if (await ensureUniqueName(payload.name)) {
    throw new Error("Room name already exists.");
  }

  if (payload.floorId !== undefined && payload.floorId !== null) {
    if (!(await validateFloorExists(payload.floorId))) {
      throw new Error("Floor with the provided ID does not exist.");
    }
  }

  const [created] = await db.insert(roomModel).values(payload).returning();
  return created;
}

export async function getAllRooms() {
  return db.select().from(roomModel);
}

export async function findRoomById(id: number) {
  const [room] = await db.select().from(roomModel).where(eq(roomModel.id, id));
  return room ?? null;
}

export async function updateRoom(
  id: number,
  data: Partial<RoomT> | Partial<Room>,
) {
  const { id: _, createdAt, updatedAt, ...rest } = data as Partial<RoomT>;
  const payload = normaliseRoomPayload(rest);

  if (payload.name && (await ensureUniqueName(payload.name, id))) {
    throw new Error("Room name already exists.");
  }

  if (payload.floorId !== undefined && payload.floorId !== null) {
    if (!(await validateFloorExists(payload.floorId))) {
      throw new Error("Floor with the provided ID does not exist.");
    }
  }

  const [updated] = await db
    .update(roomModel)
    .set(payload)
    .where(eq(roomModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteRoom(id: number) {
  const [deleted] = await db
    .delete(roomModel)
    .where(eq(roomModel.id, id))
    .returning();
  return deleted ?? null;
}

export async function deleteRoomSafe(id: number) {
  const [found] = await db.select().from(roomModel).where(eq(roomModel.id, id));
  if (!found) return null;

  const [deleted] = await db
    .delete(roomModel)
    .where(eq(roomModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Room deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete room.",
    records: [],
  };
}
