import { db } from "@/db/index.js";
import { AcademicHistory, academicHistoryModel, createAcademicHistorySchema } from "../models/academicHistory.model.js";
import { eq } from "drizzle-orm";
import { AcademicHistoryType } from "@/types/user/academic-history.js";
import { findAllByFormatted } from "@/utils/helper.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import { findBoardUniversityById } from "@/features/resources/services/boardUniversity.service.js";
import { findInstitutionById } from "@/features/resources/services/institution.service.js";
import { findBoardResultStatusById } from "@/features/resources/services/boardResultStatus.service.js";
import { findSpecializationById } from "@/features/resources/services/specialization.service.js";
import { z } from "zod";

// Validate input using Zod schema
function validateAcademicHistoryInput(data: Omit<AcademicHistoryType, 'id'>) {
    const parseResult = createAcademicHistorySchema.safeParse(data);
    if (!parseResult.success) {
        const error = new Error("Validation failed: " + JSON.stringify(parseResult.error.issues));
        // @ts-expect-error
        error.status = 400;
        throw error;
    }
    return parseResult.data;
}

export async function addAcademicHistory(academicHistory: AcademicHistoryType): Promise<AcademicHistoryType | null> {
    const { lastBoardUniversity, lastInstitution, lastResult, specialization, ...props } = academicHistory;
    // Validate input (excluding nested objects)
    validateAcademicHistoryInput({ ...props, studentId: academicHistory.studentId });
    const [newAcadeicHistory] = await db.insert(academicHistoryModel).values({
        ...props,
        lastBoardUniversityId: lastBoardUniversity?.id,
        lastInstitutionId: lastInstitution?.id,
        lastResultId: lastResult?.id,
        specializationId: specialization?.id
    }).returning();
    const formattedAcademicHistory = await academicHistoryResponseFormat(newAcadeicHistory);
    return formattedAcademicHistory;
};

export async function findAcademicHistoryById(id: number): Promise<AcademicHistoryType | null> {
    const [foundAcademicHistory] = await db.select().from(academicHistoryModel).where(eq(academicHistoryModel.id, id));
    if (!foundAcademicHistory) return null;
    const formattedAcademicHistory = await academicHistoryResponseFormat(foundAcademicHistory);
    return formattedAcademicHistory;
};

export async function findAcademicHistoryByStudentId(studentId: number): Promise<AcademicHistoryType | null> {
    const [foundAcademicHistory] = await db.select().from(academicHistoryModel).where(eq(academicHistoryModel.studentId, studentId));
    if (!foundAcademicHistory) return null;
    const formattedAcademicHistory = await academicHistoryResponseFormat(foundAcademicHistory);
    return formattedAcademicHistory;
};

export async function findAllAcademicHistory(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<AcademicHistoryType>> {
    const paginatedResponse = await findAllByFormatted<AcademicHistory, AcademicHistoryType>({
        fn: academicHistoryResponseFormat,
        model: academicHistoryModel,
        page,
        pageSize
    });
    return paginatedResponse;
};

export async function saveAcademicHistory(id: number, academicHistory: AcademicHistoryType): Promise<AcademicHistoryType | null> {
    const {
        lastBoardUniversity,
        lastInstitution,
        createdAt, updatedAt,
        lastResult,
        specialization,
        id: academicHistoryId,
        studentId,
        ...props
    } = academicHistory;
    // Validate input (excluding nested objects)
    validateAcademicHistoryInput({ ...props, studentId });
    // Return if the academic-history does not exist
    const foundAcademicHistory = await findAcademicHistoryById(id);
    if (!foundAcademicHistory) {
        return null;
    }
    // Update the academic-history
    const [updatedAcademicHistory] = await db.update(academicHistoryModel).set({
        ...props,
        lastBoardUniversityId: lastBoardUniversity?.id,
        lastInstitutionId: lastInstitution?.id,
        lastResultId: lastResult?.id,
        specializationId: specialization?.id
    }).where(eq(academicHistoryModel.id, id)).returning();
    const formattedAcademicHistory = await academicHistoryResponseFormat(updatedAcademicHistory);
    return formattedAcademicHistory;
};

export async function removeAcademicHistory(id: number): Promise<boolean | null> {
    // Return if the academic-history does not exist
    const foundAcademicHistory = await findAcademicHistoryById(id);
    if (!foundAcademicHistory) {
        return null;
    }
    // Delete the academic-history
    const [deletedAcademicIdentifer] = await db.delete(academicHistoryModel).where(eq(academicHistoryModel.id, id)).returning();
    if (!deletedAcademicIdentifer) {
        return false;
    }
    return true;
};

export async function academicHistoryResponseFormat(academicHistory: AcademicHistory): Promise<AcademicHistoryType | null> {
    if (!academicHistory) {
        return null;
    }
    const { lastBoardUniversityId, lastInstitutionId, lastResultId, specializationId, ...props } = academicHistory;
    const formattedAcademicHistory: AcademicHistoryType = { ...props };
    if (lastBoardUniversityId) {
        formattedAcademicHistory.lastBoardUniversity = await findBoardUniversityById(lastBoardUniversityId);
    }
    if (lastInstitutionId) {
        formattedAcademicHistory.lastInstitution = await findInstitutionById(lastInstitutionId);
    }
    if (lastResultId) {
        formattedAcademicHistory.lastResult = await findBoardResultStatusById(lastResultId);
    }
    if (specializationId) {
        formattedAcademicHistory.specialization = await findSpecializationById(specializationId);
    }
    return formattedAcademicHistory;
}