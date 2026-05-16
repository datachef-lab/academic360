import { db } from "@/db/index.js";
import { and, eq, ne } from "drizzle-orm";
import {
  AccessGroupModulePermission,
  AccessGroupModulePermissionT,
  accessGroupModulePermissionModel,
} from "@repo/db/schemas/models/administration";
import { accessGroupModulePermissionEnum } from "@repo/db/schemas/enums";

type AccessGroupModulePermissionType =
  (typeof accessGroupModulePermissionEnum.enumValues)[number];

async function ensureUniqueAccessGroupModuleAndType(
  accessGroupModuleId: number,
  type: AccessGroupModulePermissionType,
  excludeId?: number,
): Promise<boolean> {
  const whereClause =
    excludeId !== undefined
      ? and(
          eq(
            accessGroupModulePermissionModel.accessGroupModuleId,
            accessGroupModuleId,
          ),
          eq(accessGroupModulePermissionModel.type, type),
          ne(accessGroupModulePermissionModel.id, excludeId),
        )
      : and(
          eq(
            accessGroupModulePermissionModel.accessGroupModuleId,
            accessGroupModuleId,
          ),
          eq(accessGroupModulePermissionModel.type, type),
        );

  const [existing] = await db
    .select()
    .from(accessGroupModulePermissionModel)
    .where(whereClause);

  return Boolean(existing);
}

export async function createAccessGroupModulePermission(
  data: AccessGroupModulePermission,
) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as AccessGroupModulePermissionT;

  if (rest.accessGroupModuleId == null) {
    throw new Error("Access group module is required.");
  }
  if (!rest.type) {
    throw new Error("Permission type is required.");
  }

  if (
    await ensureUniqueAccessGroupModuleAndType(
      rest.accessGroupModuleId,
      rest.type,
    )
  ) {
    throw new Error(
      "Access group module permission already exists for this access group module and type.",
    );
  }

  const [created] = await db
    .insert(accessGroupModulePermissionModel)
    .values(rest)
    .returning();

  return created;
}

export async function getAllAccessGroupModulePermissions() {
  return db.select().from(accessGroupModulePermissionModel);
}

export async function findAccessGroupModulePermissionById(id: number) {
  const [found] = await db
    .select()
    .from(accessGroupModulePermissionModel)
    .where(eq(accessGroupModulePermissionModel.id, id))
    .limit(1);

  return found ?? null;
}

export async function updateAccessGroupModulePermission(
  id: number,
  data:
    | Partial<AccessGroupModulePermissionT>
    | Partial<AccessGroupModulePermission>,
) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<AccessGroupModulePermissionT>;

  const [existing] = await db
    .select()
    .from(accessGroupModulePermissionModel)
    .where(eq(accessGroupModulePermissionModel.id, id))
    .limit(1);

  if (!existing) return null;

  const payloadKeys = Object.keys(rest);
  if (payloadKeys.length === 0) {
    return existing;
  }

  const finalAccessGroupModuleId =
    (rest as Partial<AccessGroupModulePermissionT>).accessGroupModuleId ??
    existing.accessGroupModuleId;
  const finalType =
    (rest as Partial<AccessGroupModulePermissionT>).type ?? existing.type;

  if (
    await ensureUniqueAccessGroupModuleAndType(
      finalAccessGroupModuleId,
      finalType,
      id,
    )
  ) {
    throw new Error(
      "Access group module permission already exists for this access group module and type.",
    );
  }

  const [updated] = await db
    .update(accessGroupModulePermissionModel)
    .set(rest)
    .where(eq(accessGroupModulePermissionModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteAccessGroupModulePermissionSafe(id: number) {
  const [found] = await db
    .select()
    .from(accessGroupModulePermissionModel)
    .where(eq(accessGroupModulePermissionModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(accessGroupModulePermissionModel)
    .where(eq(accessGroupModulePermissionModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Access group module permission deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete access group module permission.",
    records: [],
  };
}
