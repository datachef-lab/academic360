import { db } from "@/db/index.js";
import {
  createUserStatusMasterFrequencySchema,
  userStatusMasterFrequencyModel,
  UserStatusMasterFrequency,
} from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";

function validateInput(data: Omit<UserStatusMasterFrequency, "id">) {
  const parseResult = createUserStatusMasterFrequencySchema.safeParse(data);
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

export async function addUserStatusMasterFrequency(
  payload: UserStatusMasterFrequency,
): Promise<UserStatusMasterFrequency | null> {
  const { id, ...data } = payload;
  validateInput(data);
  const [created] = await db
    .insert(userStatusMasterFrequencyModel)
    .values(data)
    .returning();
  return created || null;
}

export async function findUserStatusMasterFrequencyById(
  id: number,
): Promise<UserStatusMasterFrequency | null> {
  const [found] = await db
    .select()
    .from(userStatusMasterFrequencyModel)
    .where(eq(userStatusMasterFrequencyModel.id, id));
  return found || null;
}

export async function findUserStatusMasterFrequenciesByMasterId(
  masterId: number,
): Promise<UserStatusMasterFrequency[]> {
  const rows = await db
    .select()
    .from(userStatusMasterFrequencyModel)
    .where(eq(userStatusMasterFrequencyModel.userStatusMasterId, masterId));
  return rows;
}

export async function updateUserStatusMasterFrequency(
  id: number,
  payload: UserStatusMasterFrequency,
): Promise<UserStatusMasterFrequency | null> {
  const { id: _id, ...data } = payload;
  validateInput(data);

  const [found] = await db
    .select()
    .from(userStatusMasterFrequencyModel)
    .where(eq(userStatusMasterFrequencyModel.id, id));
  if (!found) return null;

  const [updated] = await db
    .update(userStatusMasterFrequencyModel)
    .set(data)
    .where(eq(userStatusMasterFrequencyModel.id, id))
    .returning();
  return updated || null;
}

export async function removeUserStatusMasterFrequency(
  id: number,
): Promise<boolean | null> {
  const [found] = await db
    .select()
    .from(userStatusMasterFrequencyModel)
    .where(eq(userStatusMasterFrequencyModel.id, id));
  if (!found) return null;

  const [deleted] = await db
    .delete(userStatusMasterFrequencyModel)
    .where(eq(userStatusMasterFrequencyModel.id, id))
    .returning();
  if (!deleted) return false;
  return true;
}

export async function getAllUserStatusMasterFrequencies(): Promise<
  UserStatusMasterFrequency[]
> {
  const rows = await db.select().from(userStatusMasterFrequencyModel);
  return rows;
}
