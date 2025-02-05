// import { db } from "@/db/index.ts";
// import { BloodGroup, bloodGroupModel } from "../models/bloodGroup.model.ts";
// import { PaginatedResponse } from "@/utils/PaginatedResponse.ts";
// import { count, desc } from "drizzle-orm";

import { db } from "@/db/index.ts";
import { BloodGroup, bloodGroupModel } from "../models/bloodGroup.model.ts";
import { eq } from "drizzle-orm";

export async function addBloodGroup(type: string) {
  const [newBloodGroup] = await db
    .insert(bloodGroupModel)
    .values({ type })
    .returning();

  return newBloodGroup;
}

export async function findBloodGroupById(
  id: number,
): Promise<BloodGroup | null> {
  const [foundBloodGroup] = await db
    .select()
    .from(bloodGroupModel)
    .where(eq(bloodGroupModel.id, id));

  if (!foundBloodGroup) {
    return null;
  }

  return foundBloodGroup;
}

export async function findBloodGroupByType(
  type: string,
): Promise<BloodGroup | null> {
  return null;
}

export async function saveBloodGroup(
  id: number,
  type: string,
): Promise<BloodGroup | null> {
  const existingBloodGroup = await findBloodGroupById(id);

  if (!existingBloodGroup) {
    return null;
  }

  const [updatedBloodGroup] = await db
    .update(bloodGroupModel)
    .set({ type })
    .where(eq(bloodGroupModel.id, id))
    .returning();

  return updatedBloodGroup;
}

export async function removeBloodGroup(id: number): Promise<Boolean> {
  const existingBloodGroup = await findBloodGroupById(id);

  if (!existingBloodGroup) {
    return false;
  }

  // TODO: Remove all the linkages from heatlh table

  // Delete the blood-group
  await db
    .delete(bloodGroupModel)
    .where(eq(bloodGroupModel.id, +id))
    .returning();

  return true;
}
