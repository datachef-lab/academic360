import { db } from "@/db/index.js";
import { Shift, shiftModel } from "../models/shift.model.js";
import { eq } from "drizzle-orm";

export async function getAllShifts(): Promise<Shift[]> {
    return db.select().from(shiftModel);
}

export async function getShiftById(id: number): Promise<Shift | null> {
    const [foundShift] = await db.select().from(shiftModel).where(eq(shiftModel.id, id));
    return foundShift || null;
}

export async function createShift(data: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shift> {
    const [created] = await db.insert(shiftModel).values(data).returning();
    return created;
}

export async function updateShift(id: number, data: Partial<Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Shift | null> {
    const [updated] = await db.update(shiftModel).set({ ...data, updatedAt: new Date() }).where(eq(shiftModel.id, id)).returning();
    return updated || null;
}

export async function deleteShift(id: number): Promise<boolean> {
    const deleted = await db.delete(shiftModel).where(eq(shiftModel.id, id)).returning();
    return deleted.length > 0;
}