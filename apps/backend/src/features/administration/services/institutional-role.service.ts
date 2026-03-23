import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  UserInstitutionalRole,
  UserInstitutionalRoleT,
  institutionalRoleModel,
} from "@repo/db/schemas/models/administration";

export async function createInstitutionalRole(data: UserInstitutionalRole) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as UserInstitutionalRoleT;

  if (!rest.identityMasterId) {
    throw new Error("Identity master is required.");
  }

  if (!rest.userTypeId) {
    throw new Error("User type is required.");
  }

  const [created] = await db
    .insert(institutionalRoleModel)
    .values(rest)
    .returning();

  return created;
}

export async function getAllInstitutionalRoles() {
  return db.select().from(institutionalRoleModel);
}

export async function findInstitutionalRoleById(id: number) {
  const [found] = await db
    .select()
    .from(institutionalRoleModel)
    .where(eq(institutionalRoleModel.id, id));

  return found ?? null;
}

export async function updateInstitutionalRole(
  id: number,
  data: Partial<UserInstitutionalRoleT> | Partial<UserInstitutionalRole>,
) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<UserInstitutionalRoleT>;

  const [updated] = await db
    .update(institutionalRoleModel)
    .set(rest)
    .where(eq(institutionalRoleModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteInstitutionalRoleSafe(id: number) {
  const [found] = await db
    .select()
    .from(institutionalRoleModel)
    .where(eq(institutionalRoleModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(institutionalRoleModel)
    .where(eq(institutionalRoleModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Institutional role deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete institutional role.",
    records: [],
  };
}
