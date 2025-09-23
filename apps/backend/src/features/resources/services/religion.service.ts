import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  religionModel,
  type Religion,
} from "@repo/db/schemas/models/resources/religion.model";
const religions = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Buddhist",
  "Jain",
  "Parsi",
  "Jewish",
  "Bahai",
  "Other",
];

export async function loadReligions() {
  for (let i = 0; i < religions.length; i++) {
    const name = religions[i];
    const exists = await db
      .select()
      .from(religionModel)
      .where(eq(religionModel.name, name));

    if (!exists) {
      await db.insert(religionModel).values({
        name,
        sequence: i + 1,
        isActive: true,
      });
    }
  }

  console.log("✅ Religions loaded");
}

export async function addReligion(
  religion: Religion,
): Promise<Religion | null> {
  const [newReligion] = await db
    .insert(religionModel)
    .values(religion)
    .returning();
  return newReligion;
}

export async function findReligionById(id: number): Promise<Religion | null> {
  const [foundReligion] = await db
    .select()
    .from(religionModel)
    .where(eq(religionModel.id, id));
  return foundReligion;
}

export async function findAllReligions(): Promise<Religion[]> {
  return await db.select().from(religionModel).orderBy(religionModel.sequence);
}

export async function createReligion(
  data: Omit<Religion, "id" | "createdAt" | "updatedAt">,
): Promise<Religion> {
  const [newReligion] = await db
    .insert(religionModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newReligion;
}

export async function updateReligion(
  id: number,
  data: Partial<Omit<Religion, "id" | "createdAt" | "updatedAt">>,
): Promise<Religion | null> {
  const [updatedReligion] = await db
    .update(religionModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(religionModel.id, id))
    .returning();

  return updatedReligion || null;
}

export async function deleteReligion(id: number): Promise<Religion | null> {
  const [deletedReligion] = await db
    .delete(religionModel)
    .where(eq(religionModel.id, id))
    .returning();

  return deletedReligion || null;
}

export async function findReligionByName(
  name: string,
): Promise<Religion | null> {
  const [foundReligion] = await db
    .select()
    .from(religionModel)
    .where(eq(religionModel.name, name.toUpperCase().trim()));
  return foundReligion;
}
