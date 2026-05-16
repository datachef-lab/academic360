import { db } from "@/db/index.js";
import { and, eq, ne } from "drizzle-orm";
import {
  accessGroupApplicationModel,
  AccessGroupApplication,
  AccessGroupApplicationT,
} from "@repo/db/schemas/models/administration";
import { academic360ApplicationDomainEnum } from "@repo/db/schemas/enums";

type Academic360ApplicationDomainType =
  (typeof academic360ApplicationDomainEnum.enumValues)[number];

async function ensureUniqueAccessGroupIdAndType(
  accessGroupId: number,
  type: Academic360ApplicationDomainType,
  excludeId?: number,
): Promise<boolean> {
  const whereClause =
    excludeId !== undefined
      ? and(
          eq(accessGroupApplicationModel.accessGroupId, accessGroupId),
          eq(accessGroupApplicationModel.type, type),
          ne(accessGroupApplicationModel.id, excludeId),
        )
      : and(
          eq(accessGroupApplicationModel.accessGroupId, accessGroupId),
          eq(accessGroupApplicationModel.type, type),
        );

  const [existing] = await db
    .select()
    .from(accessGroupApplicationModel)
    .where(whereClause);

  return Boolean(existing);
}

export async function createAccessGroupApplication(
  data: AccessGroupApplication,
): Promise<AccessGroupApplicationT> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as AccessGroupApplicationT;

  const payload = rest;

  if (payload.accessGroupId == null) {
    throw new Error("accessGroupId is required.");
  }
  if (payload.type == null) {
    throw new Error("type is required.");
  }

  if (
    await ensureUniqueAccessGroupIdAndType(payload.accessGroupId, payload.type)
  ) {
    throw new Error(
      "Access group application already exists for this access group and type.",
    );
  }

  const [created] = await db
    .insert(accessGroupApplicationModel)
    .values(payload)
    .returning();

  return created as AccessGroupApplicationT;
}

export async function getAllAccessGroupApplications(): Promise<
  AccessGroupApplicationT[]
> {
  const rows = await db.select().from(accessGroupApplicationModel);
  return rows as AccessGroupApplicationT[];
}

export async function findAccessGroupApplicationById(
  id: number,
): Promise<AccessGroupApplicationT | null> {
  const [row] = await db
    .select()
    .from(accessGroupApplicationModel)
    .where(eq(accessGroupApplicationModel.id, id))
    .limit(1);

  return row as AccessGroupApplicationT | null;
}

export async function updateAccessGroupApplication(
  id: number,
  data: Partial<AccessGroupApplicationT> | Partial<AccessGroupApplication>,
): Promise<AccessGroupApplicationT | null> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<AccessGroupApplicationT>;

  const payload = rest;
  const payloadKeys = Object.keys(payload);

  const [existing] = await db
    .select()
    .from(accessGroupApplicationModel)
    .where(eq(accessGroupApplicationModel.id, id))
    .limit(1);

  if (!existing) return null;

  // Allow empty updates: keep existing values untouched.
  if (payloadKeys.length === 0) {
    return existing as AccessGroupApplicationT;
  }

  const finalAccessGroupId = payload.accessGroupId ?? existing.accessGroupId;
  const finalType =
    (payload as Partial<AccessGroupApplicationT>).type ?? existing.type;

  if (
    await ensureUniqueAccessGroupIdAndType(finalAccessGroupId, finalType, id)
  ) {
    throw new Error(
      "Access group application already exists for this access group and type.",
    );
  }

  const [updated] = await db
    .update(accessGroupApplicationModel)
    .set(payload)
    .where(eq(accessGroupApplicationModel.id, id))
    .returning();

  return updated as AccessGroupApplicationT | null;
}

export async function deleteAccessGroupApplicationSafe(
  id: number,
): Promise<null | { success: boolean; message: string; records: unknown[] }> {
  const [found] = await db
    .select()
    .from(accessGroupApplicationModel)
    .where(eq(accessGroupApplicationModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(accessGroupApplicationModel)
    .where(eq(accessGroupApplicationModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Access group application deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete access group application.",
    records: [],
  };
}
