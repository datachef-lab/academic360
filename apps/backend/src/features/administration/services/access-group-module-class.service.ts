import { db } from "@/db/index.js";
import { and, eq, ne } from "drizzle-orm";
import {
  AccessGroupModuleClass,
  AccessGroupModuleClassT,
  accessGroupModuleClassModel,
} from "@repo/db/schemas/models/administration";
import { classModel } from "@repo/db/schemas/models/academics";
import { AccessGroupModuleClassDto } from "@repo/db/dtos/administration";

async function ensureUniqueAccessGroupModuleAndClass(
  accessGroupModuleId: number,
  classId: number,
  excludeId?: number,
): Promise<boolean> {
  const whereClause =
    excludeId !== undefined
      ? and(
          eq(
            accessGroupModuleClassModel.accessGroupModuleId,
            accessGroupModuleId,
          ),
          eq(accessGroupModuleClassModel.classId, classId),
          ne(accessGroupModuleClassModel.id, excludeId),
        )
      : and(
          eq(
            accessGroupModuleClassModel.accessGroupModuleId,
            accessGroupModuleId,
          ),
          eq(accessGroupModuleClassModel.classId, classId),
        );

  const [existing] = await db
    .select()
    .from(accessGroupModuleClassModel)
    .where(whereClause);

  return Boolean(existing);
}

async function modelToDto(
  model: typeof accessGroupModuleClassModel.$inferSelect | null,
): Promise<AccessGroupModuleClassDto | null> {
  if (!model) return null;

  const [classRow] = await db
    .select()
    .from(classModel)
    .where(eq(classModel.id, model.classId))
    .limit(1);

  if (!classRow) return null;

  const { classId: _classId, ...rest } = model;
  return {
    ...rest,
    class: classRow,
  };
}

export async function createAccessGroupModuleClass(
  data: AccessGroupModuleClass,
): Promise<AccessGroupModuleClassDto> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as AccessGroupModuleClassT;

  if (rest.accessGroupModuleId == null) {
    throw new Error("Access group module is required.");
  }
  if (rest.classId == null) {
    throw new Error("Class is required.");
  }

  if (
    await ensureUniqueAccessGroupModuleAndClass(
      rest.accessGroupModuleId,
      rest.classId,
    )
  ) {
    throw new Error(
      "Access group module class already exists for this access group module and class.",
    );
  }

  const [created] = await db
    .insert(accessGroupModuleClassModel)
    .values(rest)
    .returning();

  const dto = await modelToDto(created ?? null);
  if (!dto) throw new Error("Failed to map created access group module class.");
  return dto;
}

export async function getAllAccessGroupModuleClasses(): Promise<
  AccessGroupModuleClassDto[]
> {
  const rows = await db.select().from(accessGroupModuleClassModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is AccessGroupModuleClassDto => Boolean(dto));
}

export async function findAccessGroupModuleClassById(
  id: number,
): Promise<AccessGroupModuleClassDto | null> {
  const [row] = await db
    .select()
    .from(accessGroupModuleClassModel)
    .where(eq(accessGroupModuleClassModel.id, id))
    .limit(1);

  return await modelToDto(row ?? null);
}

export async function updateAccessGroupModuleClass(
  id: number,
  data: Partial<AccessGroupModuleClassT> | Partial<AccessGroupModuleClass>,
): Promise<AccessGroupModuleClassDto | null> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<AccessGroupModuleClassT>;

  const [existing] = await db
    .select()
    .from(accessGroupModuleClassModel)
    .where(eq(accessGroupModuleClassModel.id, id))
    .limit(1);

  if (!existing) return null;

  const payloadKeys = Object.keys(rest);
  if (payloadKeys.length === 0) {
    return await modelToDto(existing);
  }

  const finalAccessGroupModuleId =
    (rest as Partial<AccessGroupModuleClassT>).accessGroupModuleId ??
    existing.accessGroupModuleId;
  const finalClassId =
    (rest as Partial<AccessGroupModuleClassT>).classId ?? existing.classId;

  if (
    await ensureUniqueAccessGroupModuleAndClass(
      finalAccessGroupModuleId,
      finalClassId,
      id,
    )
  ) {
    throw new Error(
      "Access group module class already exists for this access group module and class.",
    );
  }

  const [updated] = await db
    .update(accessGroupModuleClassModel)
    .set(rest)
    .where(eq(accessGroupModuleClassModel.id, id))
    .returning();

  return await modelToDto(updated ?? null);
}

export async function deleteAccessGroupModuleClassSafe(
  id: number,
): Promise<null | { success: boolean; message: string; records: unknown[] }> {
  const [found] = await db
    .select()
    .from(accessGroupModuleClassModel)
    .where(eq(accessGroupModuleClassModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(accessGroupModuleClassModel)
    .where(eq(accessGroupModuleClassModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Access group module class deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete access group module class.",
    records: [],
  };
}
