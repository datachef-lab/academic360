import { db } from "@/db/index.js";
import {
  Occupation,
  occupationModel,
} from "@/features/resources/models/occupation.model.js";
import { eq, ilike } from "drizzle-orm";

export const loadOccupations = async () => {
  const occupations = [
    { name: "Service", sequence: 1 },
    { name: "Retired", sequence: 2 },
    { name: "Business", sequence: 3 },
    { name: "Professional", sequence: 4 },
    { name: "Consultant", sequence: 5 },
    { name: "Home Maker", sequence: 6 },
    { name: "Student", sequence: 7 },
    { name: "Others", sequence: 8 },
    { name: "Advocate", sequence: 9 },
    { name: "Accountant", sequence: 10 },
    { name: "Doctor", sequence: 11 },
    { name: "Teacher", sequence: 12 },
    { name: "Govt. Service", sequence: 13 },
    { name: "Artist", sequence: 14 },
    { name: "Armed Force", sequence: 15 },
    { name: "Nurse", sequence: 16 },
  ];

  for (const occupation of occupations) {
    const exists = await db
      .select()
      .from(occupationModel)
      .where(ilike(occupationModel.name, occupation.name));

    if (!exists.length) {
      await db.insert(occupationModel).values({
        name: occupation.name,
        sequence: occupation.sequence,
      });
    }
  }

  console.log("Occupations loaded successfully.");
};

export async function addOccupation(
  occupation: Occupation,
): Promise<Occupation | null> {
  const [newOccupation] = await db
    .insert(occupationModel)
    .values(occupation)
    .returning();
  return newOccupation;
}

export async function findOccupationById(
  id: number,
): Promise<Occupation | null> {
  const [foundOccupation] = await db
    .select()
    .from(occupationModel)
    .where(eq(occupationModel.id, id));
  return foundOccupation;
}

export async function findAllOccupations(): Promise<Occupation[]> {
  return await db
    .select()
    .from(occupationModel)
    .orderBy(occupationModel.sequence);
}

export async function createOccupation(
  data: Omit<Occupation, "id" | "createdAt" | "updatedAt">,
): Promise<Occupation> {
  const [newOccupation] = await db
    .insert(occupationModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newOccupation;
}

export async function updateOccupation(
  id: number,
  data: Partial<Omit<Occupation, "id" | "createdAt" | "updatedAt">>,
): Promise<Occupation | null> {
  const [updatedOccupation] = await db
    .update(occupationModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(occupationModel.id, id))
    .returning();

  return updatedOccupation || null;
}

export async function deleteOccupation(id: number): Promise<Occupation | null> {
  const [deletedOccupation] = await db
    .delete(occupationModel)
    .where(eq(occupationModel.id, id))
    .returning();

  return deletedOccupation || null;
}

export async function findOccupationByName(
  name: string,
): Promise<Occupation | null> {
  const [foundOccupation] = await db
    .select()
    .from(occupationModel)
    .where(eq(occupationModel.name, name.toUpperCase().trim()));
  return foundOccupation;
}
