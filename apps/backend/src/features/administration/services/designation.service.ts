import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  designationModel,
  type DesignationT,
} from "@repo/db/schemas/models/administration/designation.model.js";

type CreateDesignationInput = Omit<
  DesignationT,
  "id" | "createdAt" | "updatedAt"
>;
type UpdateDesignationInput = Partial<CreateDesignationInput>;

export async function getAllDesignations(): Promise<DesignationT[]> {
  return await db
    .select()
    .from(designationModel)
    .orderBy(designationModel.name);
}

export async function getDesignationById(
  id: number,
): Promise<DesignationT | null> {
  const [designation] = await db
    .select()
    .from(designationModel)
    .where(eq(designationModel.id, id));
  return designation ?? null;
}

export async function getDesignationByName(
  name: string,
): Promise<DesignationT | null> {
  const [designation] = await db
    .select()
    .from(designationModel)
    .where(eq(designationModel.name, name));
  return designation ?? null;
}

export async function createDesignation(
  data: CreateDesignationInput,
): Promise<DesignationT> {
  const [created] = await db.insert(designationModel).values(data).returning();
  return created;
}

export async function updateDesignation(
  id: number,
  data: UpdateDesignationInput,
): Promise<DesignationT | null> {
  const [updated] = await db
    .update(designationModel)
    .set(data)
    .where(eq(designationModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteDesignation(
  id: number,
): Promise<DesignationT | null> {
  const [deleted] = await db
    .delete(designationModel)
    .where(eq(designationModel.id, id))
    .returning();
  return deleted ?? null;
}
