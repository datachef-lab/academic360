import { db } from "@/db/index.js";
import { FeesSlab, feesSlabModel } from "../models/fees-slab.model.js";
// import { FeesSlab } from "../types/fees-slab";
import { eq } from "drizzle-orm";
import { feesSlabYearModel } from "../models/fees-slab-year-mapping.model";

export async function getAllFeesSlabs(): Promise<FeesSlab[]> {
    return db.select().from(feesSlabModel);
}

export async function getFeesSlabById(id: number): Promise<FeesSlab | null> {
    const [foundSlab] = await db.select().from(feesSlabModel).where(eq(feesSlabModel.id, id));
    return foundSlab || null;
}

export async function createFeesSlab(data: Omit<FeesSlab, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeesSlab> {
    const [created] = await db.insert(feesSlabModel).values(data).returning();
    return created;
}

export async function updateFeesSlab(id: number, data: Partial<Omit<FeesSlab, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FeesSlab | null> {
    const [updated] = await db.update(feesSlabModel).set({ ...data, updatedAt: new Date() }).where(eq(feesSlabModel.id, id)).returning();
    return updated || null;
}

export async function deleteFeesSlab(id: number): Promise<boolean> {
    const deleted = await db.delete(feesSlabModel).where(eq(feesSlabModel.id, id)).returning();
    return deleted.length > 0;
}

export const getFeesSlabsByAcademicYear = async (academicYearId: number) => {
    try {
        const slabs = await db
            .select()
            .from(feesSlabYearModel)
            .where(eq(feesSlabYearModel.academicYearId, academicYearId));
        return slabs;
    } catch (error) {
        console.error("Error getting slabs by academic year:", error);
        return null;
    }
};
