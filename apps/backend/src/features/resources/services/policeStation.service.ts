import { db } from "@/db/index.js";
import { policeStationModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

type PoliceStationInsert = typeof policeStationModel.$inferInsert;
type PoliceStationWritable = Omit<
  PoliceStationInsert,
  "id" | "createdAt" | "updatedAt"
>;

export async function findAllPoliceStations() {
  return await db
    .select()
    .from(policeStationModel)
    .orderBy(policeStationModel.name);
}

export async function findPoliceStationById(id: number) {
  const [row] = await db
    .select()
    .from(policeStationModel)
    .where(eq(policeStationModel.id, id));
  return row ?? null;
}

export async function createPoliceStation(data: PoliceStationWritable) {
  const [row] = await db.insert(policeStationModel).values(data).returning();
  return row;
}

export async function updatePoliceStation(
  id: number,
  data: Partial<PoliceStationWritable>,
) {
  const [row] = await db
    .update(policeStationModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(policeStationModel.id, id))
    .returning();
  return row ?? null;
}

export async function deletePoliceStation(id: number) {
  const [row] = await db
    .delete(policeStationModel)
    .where(eq(policeStationModel.id, id))
    .returning();
  return row ?? null;
}
