import { db } from "@/db/index.js";
import { Nationality, nationalityModel } from "@/features/resources/models/nationality.model.js";
import { eq } from "drizzle-orm";

export async function addNationality(nationality: Nationality): Promise<Nationality | null> {
    const [newNationality] = await db.insert(nationalityModel).values(nationality).returning();
    return newNationality;
}

export async function findNationalityById(id: number): Promise<Nationality | null> {
    const [foundNationality] = await db.select().from(nationalityModel).where(eq(nationalityModel.id, id));
    return foundNationality;
}

export async function findAllNationalities(): Promise<Nationality[]> {
    return await db.select().from(nationalityModel).orderBy(nationalityModel.sequence);
}

export async function createNationality(data: Omit<Nationality, 'id' | 'createdAt' | 'updatedAt'>): Promise<Nationality> {
    const [newNationality] = await db
        .insert(nationalityModel)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();
    
    return newNationality;
}

export async function updateNationality(id: number, data: Partial<Omit<Nationality, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Nationality | null> {
    const [updatedNationality] = await db
        .update(nationalityModel)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(nationalityModel.id, id))
        .returning();
    
    return updatedNationality || null;
}

export async function deleteNationality(id: number): Promise<Nationality | null> {
    const [deletedNationality] = await db
        .delete(nationalityModel)
        .where(eq(nationalityModel.id, id))
        .returning();
    
    return deletedNationality || null;
}

export async function findNationalityByName(name: string): Promise<Nationality | null> {
    const [foundNationality] = await db.select().from(nationalityModel).where(eq(nationalityModel.name, name.toUpperCase().trim()));
    return foundNationality;
}