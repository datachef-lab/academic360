import { db } from "@/db/index.ts";
import { academicHistoryModel } from "../models/academicHistory.model.ts";
import { eq } from "drizzle-orm";

export const createAcademicHistoryService = async (data: any) => {
    return await db.insert(academicHistoryModel).values(data).returning();
};

export const getAcademicHistoryByIdService = async (id: number) => {
    return await db.select().from(academicHistoryModel).where(eq(academicHistoryModel.id, id));
};

export const getAllAcademicHistoryService = async () => {
    return await db.select().from(academicHistoryModel);
};

export const updateAcademicHistoryService = async (id: number, data: any) => {
    return await db.update(academicHistoryModel).set(data).where(eq(academicHistoryModel.id, id)).returning();
};

export const deleteAcademicHistoryService = async (id: number) => {
    return await db.delete(academicHistoryModel).where(eq(academicHistoryModel.id, id)).returning();
};
