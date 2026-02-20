import { db } from "@/db/index.js";
import {
  createUserStatusMasterDomainSchema,
  userStatusMasterDomainModel,
  UserStatusMasterDomain,
} from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";

function validateInput(data: Omit<UserStatusMasterDomain, "id">) {
  const parseResult = createUserStatusMasterDomainSchema.safeParse(data);
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

export async function addUserStatusMasterDomain(
  payload: UserStatusMasterDomain,
): Promise<UserStatusMasterDomain | null> {
  const { id, ...data } = payload;
  validateInput(data);
  const [created] = await db
    .insert(userStatusMasterDomainModel)
    .values(data)
    .returning();
  return created || null;
}

export async function findUserStatusMasterDomainById(
  id: number,
): Promise<UserStatusMasterDomain | null> {
  const [found] = await db
    .select()
    .from(userStatusMasterDomainModel)
    .where(eq(userStatusMasterDomainModel.id, id));
  return found || null;
}

export async function findUserStatusMasterDomainsByMasterId(
  masterId: number,
): Promise<UserStatusMasterDomain[]> {
  const rows = await db
    .select()
    .from(userStatusMasterDomainModel)
    .where(eq(userStatusMasterDomainModel.userStatusMasterId, masterId));
  return rows;
}

export async function updateUserStatusMasterDomain(
  id: number,
  payload: UserStatusMasterDomain,
): Promise<UserStatusMasterDomain | null> {
  const { id: _id, ...data } = payload;
  validateInput(data);

  const [found] = await db
    .select()
    .from(userStatusMasterDomainModel)
    .where(eq(userStatusMasterDomainModel.id, id));
  if (!found) return null;

  const [updated] = await db
    .update(userStatusMasterDomainModel)
    .set(data)
    .where(eq(userStatusMasterDomainModel.id, id))
    .returning();
  return updated || null;
}

export async function removeUserStatusMasterDomain(
  id: number,
): Promise<boolean | null> {
  const [found] = await db
    .select()
    .from(userStatusMasterDomainModel)
    .where(eq(userStatusMasterDomainModel.id, id));
  if (!found) return null;

  const [deleted] = await db
    .delete(userStatusMasterDomainModel)
    .where(eq(userStatusMasterDomainModel.id, id))
    .returning();
  if (!deleted) return false;
  return true;
}

export async function getAllUserStatusMasterDomains(): Promise<
  UserStatusMasterDomain[]
> {
  const rows = await db.select().from(userStatusMasterDomainModel);
  return rows;
}
