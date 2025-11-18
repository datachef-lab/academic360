import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  Designation,
  designationModel,
} from "@repo/db/schemas/models/administration/designation.model.js";

type NewDesignationData = Omit<Designation, "id" | "createdAt" | "updatedAt">;
type UpdateDesignationData = Partial<
  Omit<Designation, "id" | "createdAt" | "updatedAt">
>;

export async function getAllDesignations(): Promise<Designation[]> {
  return await db
    .select()
    .from(designationModel)
    .orderBy(designationModel.name);
}

export async function getDesignationById(
  id: number,
): Promise<Designation | null> {
  const [designation] = await db
    .select()
    .from(designationModel)
    .where(eq(designationModel.id, id));
  return designation ?? null;
}

export async function getDesignationByName(
  name: string,
): Promise<Designation | null> {
  const [designation] = await db
    .select()
    .from(designationModel)
    .where(eq(designationModel.name, name));
  return designation ?? null;
}

export async function createDesignation(
  data: NewDesignationData,
): Promise<Designation> {
  const [created] = await db.insert(designationModel).values(data).returning();
  return created;
}

export async function updateDesignation(
  id: number,
  data: UpdateDesignationData,
): Promise<Designation | null> {
  const [updated] = await db
    .update(designationModel)
    .set(data)
    .where(eq(designationModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteDesignation(
  id: number,
): Promise<Designation | null> {
  const [deleted] = await db
    .delete(designationModel)
    .where(eq(designationModel.id, id))
    .returning();
  return deleted ?? null;
}
