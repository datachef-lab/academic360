import { db } from "@/db/index.js";
import {
  userStatusMasterModel,
  userStatusMasterLevelModel,
  userStatusMasterDomainModel,
  userStatusMasterFrequencyModel,
  createUserStatusMasterSchema,
  UserStatusMaster,
} from "@repo/db/schemas/models/user";
import { UserStatusMasterDto } from "@repo/db/dtos";
import { eq } from "drizzle-orm";

function validateInput(data: Omit<UserStatusMaster, "id">) {
  const parseResult = createUserStatusMasterSchema.safeParse(data);
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

async function enrichUserStatusMasterWithRelatedData(
  userStatusMaster: UserStatusMaster,
): Promise<UserStatusMasterDto> {
  const masterId = userStatusMaster.id;
  if (!masterId) {
    throw new Error("User status master ID is required for enrichment");
  }

  const [levels, domains, frequencies] = await Promise.all([
    db
      .select()
      .from(userStatusMasterLevelModel)
      .where(eq(userStatusMasterLevelModel.userStatusMasterId, masterId)),
    db
      .select()
      .from(userStatusMasterDomainModel)
      .where(eq(userStatusMasterDomainModel.userStatusMasterId, masterId)),
    db
      .select()
      .from(userStatusMasterFrequencyModel)
      .where(eq(userStatusMasterFrequencyModel.userStatusMasterId, masterId)),
  ]);

  return {
    ...userStatusMaster,
    levels,
    domains,
    frequencies,
  };
}

export async function addUserStatusMaster(
  payload: UserStatusMaster,
): Promise<UserStatusMasterDto | null> {
  const { id, ...data } = payload;
  validateInput(data);
  const [created] = await db
    .insert(userStatusMasterModel)
    .values(data)
    .returning();
  if (!created) return null;
  return enrichUserStatusMasterWithRelatedData(created);
}

export async function findUserStatusMasterById(
  id: number,
): Promise<UserStatusMasterDto | null> {
  const [found] = await db
    .select()
    .from(userStatusMasterModel)
    .where(eq(userStatusMasterModel.id, id));
  if (!found) return null;
  return enrichUserStatusMasterWithRelatedData(found);
}

export async function updateUserStatusMaster(
  id: number,
  payload: UserStatusMaster,
): Promise<UserStatusMasterDto | null> {
  const { id: _id, ...data } = payload;
  validateInput(data);
  const [found] = await db
    .select()
    .from(userStatusMasterModel)
    .where(eq(userStatusMasterModel.id, id));
  if (!found) return null;
  const [updated] = await db
    .update(userStatusMasterModel)
    .set(data)
    .where(eq(userStatusMasterModel.id, id))
    .returning();
  if (!updated) return null;
  return enrichUserStatusMasterWithRelatedData(updated);
}

export async function removeUserStatusMaster(
  id: number,
): Promise<boolean | null> {
  const [found] = await db
    .select()
    .from(userStatusMasterModel)
    .where(eq(userStatusMasterModel.id, id));
  if (!found) return null;
  const [deleted] = await db
    .delete(userStatusMasterModel)
    .where(eq(userStatusMasterModel.id, id))
    .returning();
  if (!deleted) return false;
  return true;
}

export async function getAllUserStatusMasters(): Promise<
  UserStatusMasterDto[]
> {
  const rows = await db.select().from(userStatusMasterModel);
  return Promise.all(
    rows.map((row) => enrichUserStatusMasterWithRelatedData(row)),
  );
}
