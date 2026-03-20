import { db } from "@/db/index.js";
import { and, eq, ilike, ne } from "drizzle-orm";
import {
  UserType,
  UserTypeT,
  userTypeModel,
} from "@repo/db/schemas/models/administration";
import { userTypeData } from "@/features/default-administration-data";

export async function loadDefaultUserTypes() {
  // Load primary user types
  for (const primaryUserType of userTypeData.defaultPrimaryUserTypes) {
    const [existingPrimaryUserType] = await db
      .select()
      .from(userTypeModel)
      .where(ilike(userTypeModel.name, primaryUserType.name.trim()));
    if (existingPrimaryUserType) continue;
    await db.insert(userTypeModel).values(primaryUserType).returning();
  }
  // Load sub user types
  for (const subUserType of userTypeData.defaultSubUserTypes) {
    const [existingSubUserType] = await db
      .select()
      .from(userTypeModel)
      .where(ilike(userTypeModel.name, subUserType.name.trim()));
    if (existingSubUserType) continue;
    const [primaryUserType] = await db
      .select()
      .from(userTypeModel)
      .where(eq(userTypeModel.name, subUserType.parentUserType!.name));
    if (!primaryUserType) {
      throw new Error(
        `Primary user type ${subUserType.parentUserType!.name} not found`,
      );
    }
    const subUserTypePayload = {
      ...subUserType,
      parentUserTypeId: primaryUserType.id,
    };
    await db.insert(userTypeModel).values(subUserTypePayload).returning();
  }
}

function normaliseUserTypePayload<T extends Partial<UserType | UserTypeT>>(
  data: T,
) {
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
          ilike(userTypeModel.name, trimmedName),
          ne(userTypeModel.id, excludeId),
        )
      : ilike(userTypeModel.name, trimmedName);

  const [existing] = await db.select().from(userTypeModel).where(whereClause);
  return Boolean(existing);
}

export async function createUserType(data: UserType) {
  const { id, createdAt, updatedAt, ...rest } = data as UserTypeT;
  const payload = normaliseUserTypePayload(rest);

  if (!payload.name) {
    throw new Error("User type name is required.");
  }

  if (await ensureUniqueName(payload.name)) {
    throw new Error("User type name already exists.");
  }

  const [created] = await db.insert(userTypeModel).values(payload).returning();
  return created;
}

export async function getAllUserTypes() {
  return db.select().from(userTypeModel);
}

export async function findUserTypeById(id: number) {
  const [userType] = await db
    .select()
    .from(userTypeModel)
    .where(eq(userTypeModel.id, id));

  return userType ?? null;
}

export async function updateUserType(
  id: number,
  data: Partial<UserTypeT> | Partial<UserType>,
) {
  const { id: _, createdAt, updatedAt, ...rest } = data as Partial<UserTypeT>;
  const payload = normaliseUserTypePayload(rest);

  if (payload.name && (await ensureUniqueName(payload.name, id))) {
    throw new Error("User type name already exists.");
  }

  const [updated] = await db
    .update(userTypeModel)
    .set(payload)
    .where(eq(userTypeModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteUserTypeSafe(id: number) {
  const [found] = await db
    .select()
    .from(userTypeModel)
    .where(eq(userTypeModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(userTypeModel)
    .where(eq(userTypeModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "User type deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete user type.",
    records: [],
  };
}
