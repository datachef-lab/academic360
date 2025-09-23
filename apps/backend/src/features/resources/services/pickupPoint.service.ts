import { db } from "@/db/index.js";
import { PickupPoint, pickupPointModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

export async function findAllPickupPoints(): Promise<PickupPoint[]> {
  return await db.select().from(pickupPointModel).orderBy(pickupPointModel.id);
}

export async function findPickupPointById(
  id: number,
): Promise<PickupPoint | null> {
  const [foundPickupPoint] = await db
    .select()
    .from(pickupPointModel)
    .where(eq(pickupPointModel.id, id));
  return foundPickupPoint;
}

export async function createPickupPoint(
  data: Omit<PickupPoint, "id" | "createdAt" | "updatedAt">,
): Promise<PickupPoint> {
  const [newPickupPoint] = await db
    .insert(pickupPointModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newPickupPoint;
}

export async function updatePickupPoint(
  id: number,
  data: Partial<Omit<PickupPoint, "id" | "createdAt" | "updatedAt">>,
): Promise<PickupPoint | null> {
  const [updatedPickupPoint] = await db
    .update(pickupPointModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(pickupPointModel.id, id))
    .returning();

  return updatedPickupPoint || null;
}

export async function deletePickupPoint(
  id: number,
): Promise<PickupPoint | null> {
  const [deletedPickupPoint] = await db
    .delete(pickupPointModel)
    .where(eq(pickupPointModel.id, id))
    .returning();

  return deletedPickupPoint || null;
}

export async function findPickupPointByName(
  name: string,
): Promise<PickupPoint | null> {
  const [foundPickupPoint] = await db
    .select()
    .from(pickupPointModel)
    .where(eq(pickupPointModel.name, name.trim()));
  return foundPickupPoint;
}
