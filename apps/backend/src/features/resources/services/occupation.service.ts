import { db } from "@/db/index";
import { Occupation, occupationModel } from "../models/occupation.model";
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