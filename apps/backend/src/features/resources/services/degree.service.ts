import { db } from "@/db/index.js";
import { Degree, degreeModel } from "@/features/resources/models/degree.model.js";
import { eq } from "drizzle-orm";

export async function addDegree(name: string): Promise<Degree | null> {
    const [foundDegree] = await db.insert(degreeModel).values({
        name
    }).returning();

    return foundDegree;
}

export async function findDegreeById(id: number): Promise<Degree | null> {
    const [foundDegree] = await db.select().from(degreeModel).where(eq(degreeModel.id, id));

    return foundDegree;
}

export async function findAllDegrees(): Promise<Degree[]> {
    return await db.select().from(degreeModel).orderBy(degreeModel.sequence);
}

export async function createDegree(data: Omit<Degree, 'id' | 'createdAt' | 'updatedAt'>): Promise<Degree> {
    const [newDegree] = await db
        .insert(degreeModel)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();
    
    return newDegree;
}

export async function updateDegree(id: number, data: Partial<Omit<Degree, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Degree | null> {
    const [updatedDegree] = await db
        .update(degreeModel)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(degreeModel.id, id))
        .returning();
    
    return updatedDegree || null;
}

export async function deleteDegree(id: number): Promise<Degree | null> {
    const [deletedDegree] = await db
        .delete(degreeModel)
        .where(eq(degreeModel.id, id))
        .returning();
    
    return deletedDegree || null;
}

export async function findDegreeByName(name: string): Promise<Degree | null> {
    const [foundDegree] = await db.select().from(degreeModel).where(eq(degreeModel.name, name));

    return foundDegree;
}