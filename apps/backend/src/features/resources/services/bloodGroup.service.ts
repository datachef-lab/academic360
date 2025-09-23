import { db } from "@/db/index.js";
import { BloodGroup, bloodGroupModel } from "@repo/db/schemas";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import { count, desc, eq, ilike } from "drizzle-orm";

export const loadBloodGroups = async () => {
  const bloodGroups = [
    { name: "A+" },
    { name: "A-" },
    { name: "B+" },
    { name: "B-" },
    { name: "AB+" },
    { name: "AB-" },
    { name: "O+" },
    { name: "O-" },
  ];

  for (const group of bloodGroups) {
    const exists = await db
      .select()
      .from(bloodGroupModel)
      .where(ilike(bloodGroupModel.type, group.name));

    if (!exists.length) {
      await db.insert(bloodGroupModel).values({
        type: group.name,
      });
    }
  }

  console.log("Blood groups loaded successfully.");
};

export async function findBloodGroupById(
  id: number,
): Promise<BloodGroup | null> {
  const [foundBloodGroup] = await db
    .select()
    .from(bloodGroupModel)
    .where(eq(bloodGroupModel.id, id));

  return foundBloodGroup;
}

export async function findAllBloodGroups(): Promise<BloodGroup[]> {
  return await db
    .select()
    .from(bloodGroupModel)
    .orderBy(bloodGroupModel.sequence);
}

export async function createBloodGroup(
  data: Omit<BloodGroup, "id" | "createdAt" | "updatedAt">,
): Promise<BloodGroup> {
  const [newBloodGroup] = await db
    .insert(bloodGroupModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newBloodGroup;
}

export async function updateBloodGroup(
  id: number,
  data: Partial<Omit<BloodGroup, "id" | "createdAt" | "updatedAt">>,
): Promise<BloodGroup | null> {
  const [updatedBloodGroup] = await db
    .update(bloodGroupModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(bloodGroupModel.id, id))
    .returning();

  return updatedBloodGroup || null;
}

export async function deleteBloodGroup(id: number): Promise<BloodGroup | null> {
  const [deletedBloodGroup] = await db
    .delete(bloodGroupModel)
    .where(eq(bloodGroupModel.id, id))
    .returning();

  return deletedBloodGroup || null;
}

export async function findBloodGroupByType(
  type: string,
): Promise<BloodGroup | null> {
  const [foundBloodGroup] = await db
    .select()
    .from(bloodGroupModel)
    .where(eq(bloodGroupModel.type, type));

  return foundBloodGroup || null;
}
