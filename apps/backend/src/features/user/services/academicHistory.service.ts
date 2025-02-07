import { db } from "@/db/index.js";
import { AcademicHistory, academicHistoryModel } from "../models/academicHistory.model.js";
import { eq } from "drizzle-orm";
import { AcademicHistoryType } from "@/types/user/academic-history.js";
import { findAllByFormatted } from "@/utils/helper.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";

export async function addAcademicHistory(academicHistory: AcademicHistory): Promise<AcademicHistoryType | null> {
    const [newAcadeicHistory] = await db.insert(academicHistoryModel).values(academicHistory).returning();

    const formattedAcademicHistory = await academicHistoryResponseFormat(newAcadeicHistory);

    return formattedAcademicHistory;
};

export const findAcademicHistoryById = async (id: number) => {
    return await db.select().from(academicHistoryModel).where(eq(academicHistoryModel.id, id));
};

export async function findAllAcademicHistory(page: number = 1, pageSize: 10): Promise<PaginatedResponse<AcademicHistoryType>> {
    const paginatedResponse = await findAllByFormatted<AcademicHistory, AcademicHistoryType>({
        fn: academicHistoryResponseFormat,
        model: academicHistoryModel,
        page,
        pageSize
    });

    return paginatedResponse;
};

export async function saveAcademicHistory(id: number, data: any) {
    // Return if the academic-history does not exist
    const foundAcademicHistory = await findAcademicHistoryById(id);
    if (!foundAcademicHistory) {
        return null;
    }
    // Update the academic-history
    const [updatedAcademicHistory] = await db.update(academicHistoryModel).set(data).where(eq(academicHistoryModel.id, id)).returning();
    // TODO: Save the board university
    
    // TODO: Save the instituion

    return updatedAcademicHistory;
};

export async function removeAcademicHistory(id: number) {
    // Return if the academic-history does not exist
    const foundAcademicHistory = await findAcademicHistoryById(id);
    if (!foundAcademicHistory) {
        return null;
    }
    // Delete the academic-history: -
    const [deletedAcademicIdentifer] = await db.delete(academicHistoryModel).where(eq(academicHistoryModel.id, id)).returning()

    if (!deletedAcademicIdentifer) {
        return false;
    }

    return true;
};


export async function academicHistoryResponseFormat(academicHistory: AcademicHistory): Promise<AcademicHistoryType | null> {

    return null;
}