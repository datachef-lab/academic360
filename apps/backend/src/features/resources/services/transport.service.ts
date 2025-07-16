import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { Transport, transportModel } from "@/features/resources/models/transport.model.js";

export async function findAllTransports(): Promise<Transport[]> {
    return await db.select().from(transportModel).orderBy(transportModel.id);
}

export async function findTransportById(id: number): Promise<Transport | null> {
    const [foundTransport] = await db.select().from(transportModel).where(eq(transportModel.id, id));
    return foundTransport;
}

export async function createTransport(data: Omit<Transport, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transport> {
    const [newTransport] = await db
        .insert(transportModel)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();
    
    return newTransport;
}

export async function updateTransport(id: number, data: Partial<Omit<Transport, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Transport | null> {
    const [updatedTransport] = await db
        .update(transportModel)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(transportModel.id, id))
        .returning();
    
    return updatedTransport || null;
}

export async function deleteTransport(id: number): Promise<Transport | null> {
    const [deletedTransport] = await db
        .delete(transportModel)
        .where(eq(transportModel.id, id))
        .returning();
    
    return deletedTransport || null;
}

export async function findTransportsByMode(mode: "BUS" | "TRAIN" | "METRO" | "AUTO" | "TAXI" | "CYCLE" | "WALKING" | "OTHER"): Promise<Transport[]> {
    return await db.select().from(transportModel).where(eq(transportModel.mode, mode)).orderBy(transportModel.id);
}

export async function findTransportByVehicleNumber(vehicleNumber: string): Promise<Transport | null> {
    const [foundTransport] = await db.select().from(transportModel).where(eq(transportModel.vehicleNumber, vehicleNumber.trim()));
    return foundTransport;
}
