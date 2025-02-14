import { db } from "@/db/index.js";
import { Occupation, occupationModel } from "@/features/resources/models/occupation.model.js";
import { eq } from "drizzle-orm";

export async function addOccupation(occupation: Occupation): Promise<Occupation | null> {
    const [newOccupation] = await db.insert(occupationModel).values(occupation).returning();
    return newOccupation;
}

export async function findOccupationById(id: number): Promise<Occupation | null> {
    const [foundOccupation] = await db.select().from(occupationModel).where(eq(occupationModel.id, id));
    return foundOccupation;
}

export async function findOccupationByName(name: string): Promise<Occupation | null> {
    const [foundOccupation] = await db.select().from(occupationModel).where(eq(occupationModel.name, name));
    return foundOccupation;
}