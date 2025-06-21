import { db } from "@/db";
import { feesSlabModel, FeesSlab } from "../models/fees-slab.model";
// import { FeesSlab } from "../types/fees-slab";
import { eq } from "drizzle-orm";

export const getFeesSlabs = async () => {
    try {
        const feesSlabs = await db.select().from(feesSlabModel);
        return feesSlabs;
    } catch (error) {
        return null;
    }
};

export const getFeesSlabById = async (id: number) => {
    try {
        const feesSlab = await db.select().from(feesSlabModel).where(eq(feesSlabModel.id, id));
        return feesSlab[0];
    } catch (error) {
        return null;
    }
};

export const createFeesSlab = async (feesSlab: FeesSlab) => {
    try {
        const newFeesSlab = await db.insert(feesSlabModel).values(feesSlab).returning();
        return newFeesSlab[0];
    } catch (error) {
        return null;
    }
};

export const updateFeesSlab = async (id: number, feesSlab: FeesSlab) => {
    try {
        const updatedFeesSlab = await db.update(feesSlabModel).set(feesSlab).where(eq(feesSlabModel.id, id)).returning();
        return updatedFeesSlab[0];
    } catch (error) {
        return null;
    }
};

export const deleteFeesSlab = async (id: number) => {
    try {
        const deletedFeesSlab = await db.delete(feesSlabModel).where(eq(feesSlabModel.id, id)).returning();
        return deletedFeesSlab[0];
    } catch (error) {
        return null;
    }
};
