import { db } from "@/db/index.js";
import { admissionAcademicInfoModel, AdmissionAcademicInfo } from "../models/admission-academic-info.model.js";
import { AdmissionAcademicInfoDto } from "@/types/admissions";
import { and, eq, ilike } from "drizzle-orm";
// import { createSubject, getAllSubjects, getSubjectById } from "./academic-subject.service.js";

import { createSubject, deleteSubject, findSubjectsByAcademicInfoId } from "./student-academic-subject.service.js";

// CREATE
export async function createAcademicInfo(givenDto: AdmissionAcademicInfoDto) {
    const { subjects, createdAt, updatedAt, ...base } = givenDto;

    let existingEntry = await checkExistingEntry(givenDto);
    if (!existingEntry) {
        const [newAcademicInfo] = await db
            .insert(admissionAcademicInfoModel)
            .values(base)
            .returning();
        existingEntry = newAcademicInfo;
    }

    for (const subject of subjects) {
        subject.admissionAcademicInfoId = existingEntry.id;
        const { createdAt, updatedAt, ...subjectBase } = subject;
        await createSubject(subjectBase);
    }

    return await formatAcademicInfo(existingEntry);
}

// READ by ID
export async function findAcademicInfoById(id: number) {
    const [academicInfo] = await db
        .select()
        .from(admissionAcademicInfoModel)
        .where(eq(admissionAcademicInfoModel.id, id));

    if (!academicInfo) return null;
    return await formatAcademicInfo(academicInfo);
}

// READ by Application Form ID
export async function findAcademicInfoByApplicationFormId(applicationFormId: number) {
    const [academicInfo] = await db
        .select()
        .from(admissionAcademicInfoModel)
        .where(eq(admissionAcademicInfoModel.applicationFormId, applicationFormId));

    if (!academicInfo) return null;
    return await formatAcademicInfo(academicInfo);
}

// UPDATE
export async function updateAcademicInfo(givenDto: Omit<AdmissionAcademicInfoDto, "createdAt" | "updatedAt">) {
    const foundAcademicInfo = await findAcademicInfoById(givenDto.id!);
    if (!foundAcademicInfo) return null;

    const { subjects, id, ...base } = givenDto;

    const [updatedAcademicInfo] = await db
        .update(admissionAcademicInfoModel)
        .set(base)
        .where(eq(admissionAcademicInfoModel.id, givenDto.id!))
        .returning();

    // Delete existing subjects and create new ones
    for (const subject of foundAcademicInfo.subjects) {
        await deleteSubject(subject.id!);
    }
    for (const subject of subjects) {
        subject.admissionAcademicInfoId = updatedAcademicInfo.id;
        const { createdAt, updatedAt, ...subjectBase } = subject;
        await createSubject(subjectBase);
    }

    return await formatAcademicInfo(updatedAcademicInfo);
}

// DELETE
export async function deleteAcademicInfo(id: number) {
    const foundAcademicInfo = await findAcademicInfoById(id);
    if (!foundAcademicInfo) return null;

    for (const subject of foundAcademicInfo.subjects) {
        await deleteSubject(subject.id!);
    }
    await db
        .delete(admissionAcademicInfoModel)
        .where(eq(admissionAcademicInfoModel.id, id));

    return true;
}

// FORMAT DTO
export async function formatAcademicInfo(academicInfo: AdmissionAcademicInfo): Promise<AdmissionAcademicInfoDto | null> {
    if (!academicInfo) return null;
    const subjects = await findSubjectsByAcademicInfoId(academicInfo.id!);
    return {
        ...academicInfo,
        subjects: subjects || [],
    };
}

// CHECK EXISTING
export async function checkExistingEntry(givenDto: AdmissionAcademicInfoDto) {
    const whereConditions = [
        eq(admissionAcademicInfoModel.applicationFormId, givenDto.applicationFormId),
        eq(admissionAcademicInfoModel.boardUniversityId, givenDto.boardUniversityId),
        eq(admissionAcademicInfoModel.boardResultStatus, givenDto.boardResultStatus),
    ];

    if (typeof givenDto.cuRegistrationNumber === 'string' && givenDto.cuRegistrationNumber.trim() !== '') {
        whereConditions.push(
            ilike(
                admissionAcademicInfoModel.cuRegistrationNumber,
                givenDto.cuRegistrationNumber.trim()
            )
        );
    }

    const [existingEntry] = await db
        .select()
        .from(admissionAcademicInfoModel)
        .where(and(...whereConditions));

    return existingEntry;
}
