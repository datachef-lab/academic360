import { db } from "@/db";
import { feesSlabYearModel, FeesSlabYear } from "../models/fees-slab-year-mapping.model";
// import { FeesSlabYear } from "../types/fees-slab-year-mapping";
import { eq } from "drizzle-orm";

export const getFeesSlabYears = async () => {
    try {
        const mappings = await db.select().from(feesSlabYearModel);
        return mappings;
    } catch (error) {
        return null;
    }
};

export const getFeesSlabYearById = async (id: number) => {
    try {
        const mapping = await db.select().from(feesSlabYearModel).where(eq(feesSlabYearModel.id, id));
        return mapping[0];
    } catch (error) {
        return null;
    }
};

export const createFeesSlabYear = async (mapping: FeesSlabYear) => {
    try {
        const newMapping = await db.insert(feesSlabYearModel).values(mapping).returning();
        return newMapping[0];
    } catch (error) {
        return null;
    }
};

export const updateFeesSlabYear = async (id: number, mapping: FeesSlabYear) => {
    try {
        const updatedMapping = await db.update(feesSlabYearModel).set(mapping).where(eq(feesSlabYearModel.id, id)).returning();
        return updatedMapping[0];
    } catch (error) {
        return null;
    }
};

export const deleteFeesSlabYear = async (id: number) => {
    try {
        const deletedMapping = await db.delete(feesSlabYearModel).where(eq(feesSlabYearModel.id, id)).returning();
        return deletedMapping[0];
    } catch (error) {
        return null;
    }
};
