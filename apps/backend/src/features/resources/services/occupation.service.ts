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

export async function findAllOccupations(): Promise<Occupation[]> {
    return await db.select().from(occupationModel).orderBy(occupationModel.sequence);
}

export async function createOccupation(data: Omit<Occupation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Occupation> {
    const [newOccupation] = await db
        .insert(occupationModel)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();
    
    return newOccupation;
}

export async function updateOccupation(id: number, data: Partial<Omit<Occupation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Occupation | null> {
    const [updatedOccupation] = await db
        .update(occupationModel)
        .set({
            ...data,
            updatedAt: new Date()
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

export async function findOccupationByName(name: string): Promise<Occupation | null> {
    const [foundOccupation] = await db.select().from(occupationModel).where(eq(occupationModel.name, name.toUpperCase().trim()));
    return foundOccupation;
}