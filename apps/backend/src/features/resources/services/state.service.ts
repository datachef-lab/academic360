import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { State, stateModel } from "@/features/resources/models/state.model.js";

export async function findAllStates(): Promise<State[]> {
    return await db.select().from(stateModel).orderBy(stateModel.sequence);
}

export async function findStateById(id: number): Promise<State | null> {
    const [foundState] = await db.select().from(stateModel).where(eq(stateModel.id, id));
    return foundState;
}

export async function createState(data: Omit<State, 'id' | 'createdAt' | 'updatedAt'>): Promise<State> {
    const [newState] = await db
        .insert(stateModel)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();
    
    return newState;
}

export async function updateState(id: number, data: Partial<Omit<State, 'id' | 'createdAt' | 'updatedAt'>>): Promise<State | null> {
    const [updatedState] = await db
        .update(stateModel)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(stateModel.id, id))
        .returning();
    
    return updatedState || null;
}

export async function deleteState(id: number): Promise<State | null> {
    const [deletedState] = await db
        .delete(stateModel)
        .where(eq(stateModel.id, id))
        .returning();
    
    return deletedState || null;
}

export async function findStateByName(name: string): Promise<State | null> {
    const [foundState] = await db.select().from(stateModel).where(eq(stateModel.name, name.toUpperCase().trim()));
    return foundState;
}

export async function findStatesByCountryId(countryId: number): Promise<State[]> {
    return await db.select().from(stateModel).where(eq(stateModel.countryId, countryId)).orderBy(stateModel.sequence);
}
