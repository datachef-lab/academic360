import { db } from "@/db/index.js";
import { and, eq, ne } from "drizzle-orm";
import {
  accessGroupDesignationModel,
  AccessGroupDesignation,
  AccessGroupDesignationT,
  designationModel,
  DesignationT,
} from "@repo/db/schemas/models/administration";
import { AccessGroupDesignationDto } from "@repo/db/dtos/administration";

async function ensureUniqueAccessGroupIdAndDesignationId(
  accessGroupId: number,
  designationId: number,
  excludeId?: number,
): Promise<boolean> {
  const whereClause =
    excludeId !== undefined
      ? and(
          eq(accessGroupDesignationModel.accessGroupId, accessGroupId),
          eq(accessGroupDesignationModel.designationId, designationId),
          ne(accessGroupDesignationModel.id, excludeId),
        )
      : and(
          eq(accessGroupDesignationModel.accessGroupId, accessGroupId),
          eq(accessGroupDesignationModel.designationId, designationId),
        );

  const [existing] = await db
    .select()
    .from(accessGroupDesignationModel)
    .where(whereClause);

  return Boolean(existing);
}

async function modelToDto(
  model: typeof accessGroupDesignationModel.$inferSelect | null,
): Promise<AccessGroupDesignationDto | null> {
  if (!model) return null;

  const [designation] = await db
    .select()
    .from(designationModel)
    .where(eq(designationModel.id, model.designationId))
    .limit(1);

  if (!designation) return null;

  const { designationId: _designationId, ...rest } = model as any;
  return {
    ...(rest as any),
    designation: designation as DesignationT,
  };
}

export async function createAccessGroupDesignation(
  data: AccessGroupDesignation,
): Promise<AccessGroupDesignationDto> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as AccessGroupDesignationT;

  const payload = rest;

  if (payload.accessGroupId == null) {
    throw new Error("accessGroupId is required.");
  }
  if (payload.designationId == null) {
    throw new Error("designationId is required.");
  }

  if (
    await ensureUniqueAccessGroupIdAndDesignationId(
      payload.accessGroupId,
      payload.designationId,
    )
  ) {
    throw new Error(
      "Access group designation already exists for this access group and designation.",
    );
  }

  const [created] = await db
    .insert(accessGroupDesignationModel)
    .values(payload)
    .returning();

  const dto = await modelToDto(created ?? null);
  if (!dto) throw new Error("Failed to map created access group designation.");

  return dto;
}

export async function getAllAccessGroupDesignations(): Promise<
  AccessGroupDesignationDto[]
> {
  const rows = await db.select().from(accessGroupDesignationModel);

  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is AccessGroupDesignationDto => Boolean(dto));
}

export async function findAccessGroupDesignationById(
  id: number,
): Promise<AccessGroupDesignationDto | null> {
  const [row] = await db
    .select()
    .from(accessGroupDesignationModel)
    .where(eq(accessGroupDesignationModel.id, id))
    .limit(1);

  return await modelToDto(row ?? null);
}

export async function updateAccessGroupDesignation(
  id: number,
  data: Partial<AccessGroupDesignationT> | Partial<AccessGroupDesignation>,
): Promise<AccessGroupDesignationDto | null> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<AccessGroupDesignationT>;

  const payload = rest;
  const payloadKeys = Object.keys(payload);

  const [existing] = await db
    .select()
    .from(accessGroupDesignationModel)
    .where(eq(accessGroupDesignationModel.id, id))
    .limit(1);

  if (!existing) return null;

  if (payloadKeys.length === 0) {
    return await modelToDto(existing);
  }

  const finalAccessGroupId =
    (payload as Partial<AccessGroupDesignationT>).accessGroupId ??
    existing.accessGroupId;
  const finalDesignationId =
    (payload as Partial<AccessGroupDesignationT>).designationId ??
    existing.designationId;

  if (
    await ensureUniqueAccessGroupIdAndDesignationId(
      finalAccessGroupId,
      finalDesignationId,
      id,
    )
  ) {
    throw new Error(
      "Access group designation already exists for this access group and designation.",
    );
  }

  const [updated] = await db
    .update(accessGroupDesignationModel)
    .set(payload)
    .where(eq(accessGroupDesignationModel.id, id))
    .returning();

  return await modelToDto(updated ?? null);
}

export async function deleteAccessGroupDesignationSafe(
  id: number,
): Promise<null | { success: boolean; message: string; records: unknown[] }> {
  const [found] = await db
    .select()
    .from(accessGroupDesignationModel)
    .where(eq(accessGroupDesignationModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(accessGroupDesignationModel)
    .where(eq(accessGroupDesignationModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Access group designation deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete access group designation.",
    records: [],
  };
}
