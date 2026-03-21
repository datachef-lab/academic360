import { db } from "@/db/index.js";
import { and, eq, ne } from "drizzle-orm";
import {
  accessGroupUserTypeModel,
  AccessGroupUserType,
  AccessGroupUserTypeT,
  userTypeModel,
  UserTypeT,
} from "@repo/db/schemas/models/administration";
import { AccessGroupUserTypeDto } from "@repo/db/dtos/administration";

async function ensureUniqueAccessGroupIdAndUserTypeId(
  accessGroupId: number,
  userTypeId: number,
  excludeId?: number,
): Promise<boolean> {
  const whereClause =
    excludeId !== undefined
      ? and(
          eq(accessGroupUserTypeModel.accessGroupId, accessGroupId),
          eq(accessGroupUserTypeModel.userTypeId, userTypeId),
          ne(accessGroupUserTypeModel.id, excludeId),
        )
      : and(
          eq(accessGroupUserTypeModel.accessGroupId, accessGroupId),
          eq(accessGroupUserTypeModel.userTypeId, userTypeId),
        );

  const [existing] = await db
    .select()
    .from(accessGroupUserTypeModel)
    .where(whereClause);

  return Boolean(existing);
}

async function modelToDto(
  model: typeof accessGroupUserTypeModel.$inferSelect | null,
): Promise<AccessGroupUserTypeDto | null> {
  if (!model) return null;

  const [userType] = await db
    .select()
    .from(userTypeModel)
    .where(eq(userTypeModel.id, model.userTypeId))
    .limit(1);

  if (!userType) return null;

  const { userTypeId: _userTypeId, ...rest } = model as any;
  return {
    ...(rest as any),
    userType: userType as UserTypeT,
  };
}

export async function createAccessGroupUserType(
  data: AccessGroupUserType,
): Promise<AccessGroupUserTypeDto> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as AccessGroupUserTypeT;

  const payload = rest;

  if (payload.accessGroupId == null) {
    throw new Error("accessGroupId is required.");
  }
  if (payload.userTypeId == null) {
    throw new Error("userTypeId is required.");
  }

  if (
    await ensureUniqueAccessGroupIdAndUserTypeId(
      payload.accessGroupId,
      payload.userTypeId,
    )
  ) {
    throw new Error(
      "Access group user type already exists for this access group and user type.",
    );
  }

  const [created] = await db
    .insert(accessGroupUserTypeModel)
    .values(payload)
    .returning();

  const dto = await modelToDto(created ?? null);
  if (!dto) throw new Error("Failed to map created access group user type.");

  return dto;
}

export async function getAllAccessGroupUserTypes(): Promise<
  AccessGroupUserTypeDto[]
> {
  const rows = await db.select().from(accessGroupUserTypeModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is AccessGroupUserTypeDto => Boolean(dto));
}

export async function findAccessGroupUserTypeById(
  id: number,
): Promise<AccessGroupUserTypeDto | null> {
  const [row] = await db
    .select()
    .from(accessGroupUserTypeModel)
    .where(eq(accessGroupUserTypeModel.id, id))
    .limit(1);

  return await modelToDto(row ?? null);
}

export async function updateAccessGroupUserType(
  id: number,
  data: Partial<AccessGroupUserTypeT> | Partial<AccessGroupUserType>,
): Promise<AccessGroupUserTypeDto | null> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<AccessGroupUserTypeT>;

  const payload = rest;
  const payloadKeys = Object.keys(payload);

  const [existing] = await db
    .select()
    .from(accessGroupUserTypeModel)
    .where(eq(accessGroupUserTypeModel.id, id))
    .limit(1);

  if (!existing) return null;
  if (payloadKeys.length === 0) return await modelToDto(existing);

  const finalAccessGroupId =
    (payload as Partial<AccessGroupUserTypeT>).accessGroupId ??
    existing.accessGroupId;
  const finalUserTypeId =
    (payload as Partial<AccessGroupUserTypeT>).userTypeId ??
    existing.userTypeId;

  if (
    await ensureUniqueAccessGroupIdAndUserTypeId(
      finalAccessGroupId,
      finalUserTypeId,
      id,
    )
  ) {
    throw new Error(
      "Access group user type already exists for this access group and user type.",
    );
  }

  const [updated] = await db
    .update(accessGroupUserTypeModel)
    .set(payload)
    .where(eq(accessGroupUserTypeModel.id, id))
    .returning();

  return await modelToDto(updated ?? null);
}

export async function deleteAccessGroupUserTypeSafe(
  id: number,
): Promise<null | { success: boolean; message: string; records: unknown[] }> {
  const [found] = await db
    .select()
    .from(accessGroupUserTypeModel)
    .where(eq(accessGroupUserTypeModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(accessGroupUserTypeModel)
    .where(eq(accessGroupUserTypeModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Access group user type deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete access group user type.",
    records: [],
  };
}
