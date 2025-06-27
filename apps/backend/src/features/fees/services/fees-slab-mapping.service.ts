import { db } from "@/db/index.js";
import { feesSlabMappingModel, FeesSlabMapping } from "../models/fees-slab-mapping.model.js";
// import { FeesSlabMapping } from "../types/fees-slab-Mapping-mapping";
import { and, eq } from "drizzle-orm";

export const getFeesSlabMapping = async () => {
    try {
        const mappings = await db.select().from(feesSlabMappingModel);
        return mappings;
    } catch (error) {
        return null;
    }
};

export const getFeesSlabMappingsByFeesStructureId = async (fessStructureId: number): Promise<FeesSlabMapping[]> => {
    try {
        const mappings = await db
            .select()
            .from(feesSlabMappingModel)
            .where(eq(feesSlabMappingModel.feesStructureId, fessStructureId));
        return mappings.filter(ele => ele);
    } catch (error) {
        return [];
    }
};

export const getFeesSlabMappingById = async (id: number) => {
    try {
        const mapping = await db.select().from(feesSlabMappingModel).where(eq(feesSlabMappingModel.id, id));
        return mapping[0];
    } catch (error) {
        return null;
    }
};

export const createFeesSlabMapping = async (mapping: FeesSlabMapping) => {
    try {
        const [existing] = await db
            .select()
            .from(feesSlabMappingModel)
            .where(
                and(
                    eq(feesSlabMappingModel.feesSlabId, mapping.feesSlabId),
                    eq(feesSlabMappingModel.feesStructureId, mapping.feesStructureId),
                )
            );

        if (existing) {
            console.log("existing fees-slab mapping:", existing);
            return null;
        }
        const newMapping = await db.insert(feesSlabMappingModel).values(mapping).returning();
        return newMapping[0];
    } catch (error) {
        console.log(error)
        return null;
    }
};

export const updateFeesSlabMapping = async (id: number, mapping: FeesSlabMapping) => {
    try {
        const updatedMapping = await db.update(feesSlabMappingModel).set(mapping).where(eq(feesSlabMappingModel.id, id)).returning();
        return updatedMapping[0];
    } catch (error) {
        return null;
    }
};

export const deleteFeesSlabMapping = async (id: number) => {
    try {
        const deletedMapping = await db.delete(feesSlabMappingModel).where(eq(feesSlabMappingModel.id, id)).returning();
        return deletedMapping[0];
    } catch (error) {
        return null;
    }
};

export const checkSlabsExistForMapping = async (feesStructureId: number) => {
    try {
        const mappings = await db
            .select()
            .from(feesSlabMappingModel)
            .where(eq(feesSlabMappingModel.feesStructureId, feesStructureId));
        return { exists: mappings.length > 0 };
    } catch (error) {
        console.error("Error checking slabs existence:", error);
        return { exists: false };
    }
};
