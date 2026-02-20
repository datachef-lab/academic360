import { db } from "@/db/index.js";
import {
  userStatusMasterLevelModel,
  createUserStatusMasterLevelSchema,
  UserStatusMasterLevel,
} from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";

function validateInput(data: Omit<UserStatusMasterLevel, "id">) {
  const parseResult = createUserStatusMasterLevelSchema.safeParse(data);
  if (!parseResult.success) {
    const error = new Error(
      "Validation failed: " + JSON.stringify(parseResult.error.issues),
    );
    // @ts-expect-error
    error.status = 400;
    throw error;
  }
  return parseResult.data;
}

export async function addUserStatusMasterLevel(
  payload: UserStatusMasterLevel,
): Promise<UserStatusMasterLevel | null> {
  const { id, ...data } = payload;
  validateInput(data);
  const [created] = await db
    .insert(userStatusMasterLevelModel)
    .values(data)
    .returning();
  return created;
}

export async function findUserStatusMasterLevelById(
  id: number,
): Promise<UserStatusMasterLevel | null> {
  const [found] = await db
    .select()
    .from(userStatusMasterLevelModel)
    .where(eq(userStatusMasterLevelModel.id, id));
  return found || null;
}

export async function findUserStatusMasterLevelsByMasterId(
  masterId: number,
): Promise<UserStatusMasterLevel[]> {
  const rows = await db
    .select()
    .from(userStatusMasterLevelModel)
    .where(eq(userStatusMasterLevelModel.userStatusMasterId, masterId));
  return rows;
}

export async function updateUserStatusMasterLevel(
  id: number,
  payload: UserStatusMasterLevel,
): Promise<UserStatusMasterLevel | null> {
  const { id: _id, ...data } = payload;
  validateInput(data);
  const [found] = await db
    .select()
    .from(userStatusMasterLevelModel)
    .where(eq(userStatusMasterLevelModel.id, id));
  if (!found) return null;
  const [updated] = await db
    .update(userStatusMasterLevelModel)
    .set(data)
    .where(eq(userStatusMasterLevelModel.id, id))
    .returning();
  return updated || null;
}

export async function removeUserStatusMasterLevel(
  id: number,
): Promise<boolean | null> {
  const [found] = await db
    .select()
    .from(userStatusMasterLevelModel)
    .where(eq(userStatusMasterLevelModel.id, id));
  if (!found) return null;
  const [deleted] = await db
    .delete(userStatusMasterLevelModel)
    .where(eq(userStatusMasterLevelModel.id, id))
    .returning();
  if (!deleted) return false;
  return true;
}

export async function getAllUserStatusMasterLevels(): Promise<
  UserStatusMasterLevel[]
> {
  const rows = await db.select().from(userStatusMasterLevelModel);
  return rows;
}
