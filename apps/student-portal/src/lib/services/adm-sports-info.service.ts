import { dbPostgres } from "@/db";
import { SportsInfo, sportsInfo } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createSportsInfo(data: Omit<SportsInfo, "id" | "createdAt" | "updatedAt">) {
    try {
        const result = await dbPostgres.insert(sportsInfo).values(data).returning();
        return result[0];
    } catch (error) {
        console.error("Error creating sports info:", error);
        throw error;
    }
}

export async function updateSportsInfo(id: number, data: Partial<Omit<SportsInfo, "id" | "createdAt" | "updatedAt">>) {
    try {
        const result = await dbPostgres.update(sportsInfo)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where(eq(sportsInfo.id, id))
            .returning();
        return result[0];
    } catch (error) {
        console.error("Error updating sports info:", error);
        throw error;
    }
}

export async function deleteSportsInfo(id: number) {
    try {
        const result = await dbPostgres.delete(sportsInfo)
            .where(eq(sportsInfo.id, id))
            .returning();
        return result[0];
    } catch (error) {
        console.error("Error deleting sports info:", error);
        throw error;
    }
}

export async function getSportsInfoById(id: number) {
    try {
        const result = await dbPostgres.select()
            .from(sportsInfo)
            .where(eq(sportsInfo.id, id));
        return result[0];
    } catch (error) {
        console.error("Error getting sports info:", error);
        throw error;
    }
}

export async function getSportsInfoByAdditionalInfoId(additionalInfoId: number) {
    try {
        const result = await dbPostgres.select()
            .from(sportsInfo)
            .where(eq(sportsInfo.additionalInfoId, additionalInfoId));
        return result;
    } catch (error) {
        console.error("Error getting sports info by additional info id:", error);
        throw error;
    }
}