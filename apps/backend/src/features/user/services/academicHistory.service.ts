import { db } from "@/db/index.js";
import { AcademicHistory, academicHistoryModel } from "../models/academicHistory.model.js";
import { eq } from "drizzle-orm";
import { AcademicHistoryType } from "@/types/user/academic-history.js";
import { findAllByFormatted } from "@/utils/helper.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import { findBoardUniversityById } from "@/features/resources/services/boardUniversity.service.js";
import { findInstitutionById } from "@/features/resources/services/institution.service.js";
import { findBoardResultStatusById } from "@/features/resources/services/boardResultStatus.service.js";
import { findSpecializationById } from "@/features/resources/services/specialization.service.js";

export async function addAcademicHistory(academicHistory: AcademicHistoryType): Promise<AcademicHistoryType | null> {
    const { lastBoardUniversity, lastInstitution, lastResult, specialization, ...props } = academicHistory;

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

export async function findAcademicHistoryById(id: number) {
    const [foundAcademicHistory] = await db.select().from(academicHistoryModel).where(eq(academicHistoryModel.id, id));

    const formattedAcademicHistory = await academicHistoryResponseFormat(foundAcademicHistory);

    return formattedAcademicHistory;
};

export async function findAcademicHistoryByStudentId(studentId: number) {
    const [foundAcademicHistory] = await db.select().from(academicHistoryModel).where(eq(academicHistoryModel.studentId, studentId));

    const formattedAcademicHistory = await academicHistoryResponseFormat(foundAcademicHistory);

    return formattedAcademicHistory;
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

export async function saveAcademicHistory(id: number, academicHistory: AcademicHistoryType): Promise<AcademicHistoryType | null> {
    const {
        lastBoardUniversity,
        lastInstitution,
        createdAt,updatedAt,
        lastResult,
        specialization,
        id: academicHistoryId,
        studentId,
        
        ...props
    } = academicHistory;

    // Return if the academic-history does no exist  const {createdAt,updatedAt,...props}=req.body as EmergencyContact
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