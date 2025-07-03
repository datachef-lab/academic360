import { db } from "@/db/index.js";
import { instalmentModel, Instalment } from "../models/instalment.model.js";
import { eq } from "drizzle-orm";

export const createInstalment = async (instalment: Omit<Instalment, "id">): Promise<Instalment | null> => {
    const [created] = await db.insert(instalmentModel).values(instalment).returning();
    return created || null;
};

export const getInstalmentById = async (id: number): Promise<Instalment | null> => {
    const [instalment] = await db.select().from(instalmentModel).where(eq(instalmentModel.id, id));
    return instalment || null;
};

export const getInstalmentsByFeesStructureId = async (feesStructureId: number): Promise<Instalment[]> => {
    return db.select().from(instalmentModel).where(eq(instalmentModel.feesStructureId, feesStructureId));
};

export const updateInstalment = async (id: number, data: Partial<Instalment>): Promise<Instalment | null> => {
    const [updated] = await db.update(instalmentModel).set(data).where(eq(instalmentModel.id, id)).returning();
    return updated || null;
};

export const deleteInstalment = async (id: number): Promise<Instalment | null> => {
    const [deleted] = await db.delete(instalmentModel).where(eq(instalmentModel.id, id)).returning();
    return deleted || null;
};
