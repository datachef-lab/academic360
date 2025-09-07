import { db } from "@/db/index.js";
import {
  Country,
  countryModel,
} from "@/features/resources/models/country.model.js";
import { eq } from "drizzle-orm";

export async function findCountryById(id: number): Promise<Country | null> {
  const [foundCountry] = await db
    .select()
    .from(countryModel)
    .where(eq(countryModel.id, id));
  return foundCountry;
}

export async function findAllCountries(): Promise<Country[]> {
  return await db.select().from(countryModel).orderBy(countryModel.sequence);
}

export async function createCountry(
  data: Omit<Country, "id" | "createdAt" | "updatedAt">,
): Promise<Country> {
  const [newCountry] = await db
    .insert(countryModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newCountry;
}

export async function updateCountry(
  id: number,
  data: Partial<Omit<Country, "id" | "createdAt" | "updatedAt">>,
): Promise<Country | null> {
  const [updatedCountry] = await db
    .update(countryModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(countryModel.id, id))
    .returning();

  return updatedCountry || null;
}

export async function deleteCountry(id: number): Promise<Country | null> {
  const [deletedCountry] = await db
    .delete(countryModel)
    .where(eq(countryModel.id, id))
    .returning();

  return deletedCountry || null;
}

export async function findCountryByName(name: string): Promise<Country | null> {
  const [foundCountry] = await db
    .select()
    .from(countryModel)
    .where(eq(countryModel.name, name));

  return foundCountry || null;
}
