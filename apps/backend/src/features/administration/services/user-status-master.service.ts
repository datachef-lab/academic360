import { db } from "@/db/index.js";
import { and, eq, ilike, ne } from "drizzle-orm";
import {
  UserStatusMaster,
  UserStatusMasterT,
  userStatusMasterModel,
} from "@repo/db/schemas/models/administration";
import { UserStatusMasterDto } from "@repo/db/dtos/administration";

function normaliseUserStatusMasterPayload<
  T extends Partial<UserStatusMaster | UserStatusMasterT>,
>(data: T) {
  const clone = { ...data };

  if (clone.name && typeof clone.name === "string") {
    clone.name = clone.name.trim() as T["name"];
  }

  if (
    clone.description !== undefined &&
    clone.description !== null &&
    typeof clone.description === "string"
  ) {
    clone.description = clone.description.trim() as T["description"];
  }

  if (
    clone.code !== undefined &&
    clone.code !== null &&
    typeof clone.code === "string"
  ) {
    clone.code = clone.code.trim() as T["code"];
  }

  if (
    clone.color !== undefined &&
    clone.color !== null &&
    typeof clone.color === "string"
  ) {
    clone.color = clone.color.trim() as T["color"];
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
      ? and(
          ilike(userStatusMasterModel.name, trimmedName),
          ne(userStatusMasterModel.id, excludeId),
        )
      : ilike(userStatusMasterModel.name, trimmedName);

  const [existing] = await db
    .select()
    .from(userStatusMasterModel)
    .where(whereClause);
  return Boolean(existing);
}

async function modelToDto(
  model: typeof userStatusMasterModel.$inferSelect | null,
  seen = new Set<number>(),
): Promise<UserStatusMasterDto | null> {
  if (!model) return null;
  if (seen.has(model.id)) return null;

  let parentUserStatusMaster: UserStatusMasterT | null = null;

  let parentUserStatusMasterId: UserStatusMasterDto | null = null;
  if (model.parentUserStatusMasterId) {
    seen.add(model.id);
    const [parent] = await db
      .select()
      .from(userStatusMasterModel)
      .where(eq(userStatusMasterModel.id, model.parentUserStatusMasterId));
    parentUserStatusMaster = await modelToDto(parent ?? null, seen);
    seen.delete(model.id);
  }

  return {
    ...model,
    parentUserStatusMaster,
  };
}

export async function createUserStatusMaster(data: UserStatusMaster) {
  const { id, createdAt, updatedAt, ...rest } = data as UserStatusMasterT;
  const payload = normaliseUserStatusMasterPayload(rest);

  if (!payload.name) {
    throw new Error("User status master name is required.");
  }

  if (await ensureUniqueName(payload.name)) {
    throw new Error("User status master name already exists.");
  }

  const [created] = await db
    .insert(userStatusMasterModel)
    .values(payload)
    .returning();

  return await modelToDto(created);
}

export async function getAllUserStatusMasters() {
  const rows = await db.select().from(userStatusMasterModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is UserStatusMasterDto => dto !== null);
}

export async function findUserStatusMasterById(id: number) {
  const [row] = await db
    .select()
    .from(userStatusMasterModel)
    .where(eq(userStatusMasterModel.id, id));

  return await modelToDto(row ?? null);
}

export async function updateUserStatusMaster(
  id: number,
  data: Partial<UserStatusMasterT> | Partial<UserStatusMaster>,
) {
  const {
    id: _,
    createdAt,
    updatedAt,
    ...rest
  } = data as Partial<UserStatusMasterT>;
  const payload = normaliseUserStatusMasterPayload(rest);

  if (payload.name && (await ensureUniqueName(payload.name, id))) {
    throw new Error("User status master name already exists.");
  }

  const [updated] = await db
    .update(userStatusMasterModel)
    .set(payload)
    .where(eq(userStatusMasterModel.id, id))
    .returning();

  return await modelToDto(updated ?? null);
}

export async function deleteUserStatusMasterSafe(id: number) {
  const [found] = await db
    .select()
    .from(userStatusMasterModel)
    .where(eq(userStatusMasterModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(userStatusMasterModel)
    .where(eq(userStatusMasterModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "User status master deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete user status master.",
    records: [],
  };
}
