import { db } from "@/db/index";
import { Nationality, nationalityModel } from "../models/nationality.model";
import { eq } from "drizzle-orm";

export async function addNationality(nationality: Nationality): Promise<Nationality | null> {
    const [newNationality] = await db.insert(nationalityModel).values(nationality).returning();
    return newNationality;
}

export async function findNationalityById(id: number): Promise<Nationality | null> {
    const [foundNationality] = await db.select().from(nationalityModel).where(eq(nationalityModel.id, id));
    return foundNationality;
}

export async function findNationalityByName(name: string): Promise<Nationality | null> {
    const [foundNationality] = await db.select().from(nationalityModel).where(eq(nationalityModel.name, name.toUpperCase().trim()));
    return foundNationality;
}