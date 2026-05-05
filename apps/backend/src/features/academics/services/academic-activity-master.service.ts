import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { academicActivityMasterModel } from "@repo/db/schemas/models/academics/academic-activity-master.model.js";
import { AcademicActivityMasterT } from "@repo/db/schemas/models/academics/academic-activity-master.model.js";

export type CreateMasterPayload = {
  type: string;
  name: string;
  description?: string | null;
  remarks?: string | null;
  isActive?: boolean;
};

export type UpdateMasterPayload = Partial<CreateMasterPayload>;

export async function getAllActivityMasters(): Promise<
  AcademicActivityMasterT[]
> {
  return db
    .select()
    .from(academicActivityMasterModel)
    .orderBy(academicActivityMasterModel.id);
}

export async function getActivityMasterById(
  id: number,
): Promise<AcademicActivityMasterT | null> {
  const [row] = await db
    .select()
    .from(academicActivityMasterModel)
    .where(eq(academicActivityMasterModel.id, id));
  return row ?? null;
}

export async function createActivityMaster(
  payload: CreateMasterPayload,
): Promise<AcademicActivityMasterT> {
  const [created] = await db
    .insert(academicActivityMasterModel)
    .values({
      type: payload.type as any,
      name: payload.name,
      description: payload.description ?? null,
      remarks: payload.remarks ?? null,
      isActive: payload.isActive ?? true,
    })
    .returning();
  return created;
}

export async function updateActivityMaster(
  id: number,
  payload: UpdateMasterPayload,
): Promise<AcademicActivityMasterT | null> {
  const [existing] = await db
    .select()
    .from(academicActivityMasterModel)
    .where(eq(academicActivityMasterModel.id, id));
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (payload.type !== undefined) updateData.type = payload.type;
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.description !== undefined)
    updateData.description = payload.description;
  if (payload.remarks !== undefined) updateData.remarks = payload.remarks;
  if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

  if (Object.keys(updateData).length > 0) {
    const [updated] = await db
      .update(academicActivityMasterModel)
      .set(updateData)
      .where(eq(academicActivityMasterModel.id, id))
      .returning();
    return updated;
  }
  return existing;
}

export async function deleteActivityMaster(id: number): Promise<boolean> {
  const deleted = await db
    .delete(academicActivityMasterModel)
    .where(eq(academicActivityMasterModel.id, id))
    .returning();
  return deleted.length > 0;
}
