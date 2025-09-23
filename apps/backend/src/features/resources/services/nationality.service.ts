import { db } from "@/db/index.js";
import {
  nationalityModel,
  type Nationality,
} from "@repo/db/schemas/models/resources/nationality.model";
import { eq, ilike } from "drizzle-orm";

export const loadNationalities = async () => {
  const nationalities = [
    { name: "Indian", sequence: 1, code: 101 },
    { name: "Bangladeshi", sequence: 2, code: 999 },
    { name: "Bhutanese", sequence: 3, code: 999 },
    { name: "Nepalese", sequence: 4, code: 999 },
    { name: "Chinese", sequence: 5, code: 999 },
    { name: "Others", sequence: 6, code: 999 },
    { name: "Indonesian", sequence: 7, code: 999 },
    { name: "Iranian", sequence: 8, code: 999 },
    { name: "Iraqi", sequence: 9, code: 999 },
    { name: "Japanese", sequence: 10, code: 999 },
    { name: "Jordanian", sequence: 11, code: 999 },
    { name: "Malaysian", sequence: 12, code: 999 },
    { name: "Nigerian", sequence: 13, code: 999 },
    { name: "Sri Lankan", sequence: 14, code: 999 },
    { name: "Dutch", sequence: 15, code: 999 },
  ];

  for (const nationality of nationalities) {
    const existing = await db
      .select()
      .from(nationalityModel)
      .where(ilike(nationalityModel.name, nationality.name));

    if (!existing.length) {
      await db.insert(nationalityModel).values({
        name: nationality.name,
        sequence: nationality.sequence,
        code: nationality.code,
        isActive: true,
      });
    }
  }

  console.log("Nationalities loaded successfully.");
};

export async function addNationality(
  nationality: Nationality,
): Promise<Nationality | null> {
  const [newNationality] = await db
    .insert(nationalityModel)
    .values(nationality)
    .returning();
  return newNationality;
}

export async function findNationalityById(
  id: number,
): Promise<Nationality | null> {
  const [foundNationality] = await db
    .select()
    .from(nationalityModel)
    .where(eq(nationalityModel.id, id));
  return foundNationality;
}

export async function findAllNationalities(): Promise<Nationality[]> {
  return await db
    .select()
    .from(nationalityModel)
    .orderBy(nationalityModel.sequence);
}

export async function createNationality(
  data: Omit<Nationality, "id" | "createdAt" | "updatedAt">,
): Promise<Nationality> {
  const [newNationality] = await db
    .insert(nationalityModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newNationality;
}

export async function updateNationality(
  id: number,
  data: Partial<Omit<Nationality, "id" | "createdAt" | "updatedAt">>,
): Promise<Nationality | null> {
  const [updatedNationality] = await db
    .update(nationalityModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(nationalityModel.id, id))
    .returning();

  return updatedNationality || null;
}

export async function deleteNationality(
  id: number,
): Promise<Nationality | null> {
  const [deletedNationality] = await db
    .delete(nationalityModel)
    .where(eq(nationalityModel.id, id))
    .returning();

  return deletedNationality || null;
}

export async function findNationalityByName(
  name: string,
): Promise<Nationality | null> {
  const [foundNationality] = await db
    .select()
    .from(nationalityModel)
    .where(eq(nationalityModel.name, name.toUpperCase().trim()));
  return foundNationality;
}
