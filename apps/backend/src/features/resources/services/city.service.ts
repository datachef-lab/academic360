import { db } from "@/db/index.js";
import { City, cityModel } from "@/features/resources/models/city.model.js";
import { eq } from "drizzle-orm";

export async function findCityById(id: number): Promise<City | null> {
    const [foundCity] = await db.select().from(cityModel).where(eq(cityModel.id, id));
    return foundCity;
}

export async function findAllCities(): Promise<City[]> {
    return await db.select().from(cityModel).orderBy(cityModel.sequence);
}

export async function createCity(data: Omit<City, 'id' | 'createdAt' | 'updatedAt'>): Promise<City> {
    const [newCity] = await db
        .insert(cityModel)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();
    
    return newCity;
}

export async function updateCity(id: number, data: Partial<Omit<City, 'id' | 'createdAt' | 'updatedAt'>>): Promise<City | null> {
    const [updatedCity] = await db
        .update(cityModel)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(cityModel.id, id))
        .returning();
    
    return updatedCity || null;
}

export async function deleteCity(id: number): Promise<City | null> {
    const [deletedCity] = await db
        .delete(cityModel)
        .where(eq(cityModel.id, id))
        .returning();
    
    return deletedCity || null;
}

export async function findCityByName(name: string): Promise<City | null> {
    const [foundCity] = await db
        .select()
        .from(cityModel)
        .where(eq(cityModel.name, name));
    
    return foundCity || null;
}

export async function findCityByCode(code: string): Promise<City | null> {
    const [foundCity] = await db
        .select()
        .from(cityModel)
        .where(eq(cityModel.code, code));
    
    return foundCity || null;
}

export async function findCitiesByStateId(stateId: number): Promise<City[]> {
    return await db
        .select()
        .from(cityModel)
        .where(eq(cityModel.stateId, stateId))
        .orderBy(cityModel.sequence);
}
