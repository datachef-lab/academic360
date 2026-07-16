import { db } from "@/db/index.js";
import { districtModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

type DistrictInsert = typeof districtModel.$inferInsert;
type DistrictWritable = Omit<DistrictInsert, "id" | "createdAt" | "updatedAt">;

export async function findAllDistricts() {
  return await db.select().from(districtModel).orderBy(districtModel.sequence);
}

export async function findDistrictById(id: number) {
  const [row] = await db
    .select()
    .from(districtModel)
    .where(eq(districtModel.id, id));
  return row ?? null;
}

export async function createDistrict(data: DistrictWritable) {
  const [row] = await db.insert(districtModel).values(data).returning();
  return row;
}

export async function updateDistrict(
  id: number,
  data: Partial<DistrictWritable>,
) {
  const [row] = await db
    .update(districtModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(districtModel.id, id))
    .returning();
  return row ?? null;
}

export async function deleteDistrict(id: number) {
  const [row] = await db
    .delete(districtModel)
    .where(eq(districtModel.id, id))
    .returning();
  return row ?? null;
}
