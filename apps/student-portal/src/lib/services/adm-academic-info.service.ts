import {dbPostgres} from "@/db";
import { AdmissionAcademicInfo, admissionAcademicInfo } from "@/db/schema";
import { AdmissionAcademicInfoDto } from "@/types/admissions";
import { and, eq, ilike, isNull } from "drizzle-orm";
import { createSubject, deleteSubject, findSubjectsByAcademicInfoId } from "./adm-student-subject.service";

export async function createAcademicInfo(givenDto: AdmissionAcademicInfoDto) {
    const { subjects, createdAt, updatedAt, ...base } = givenDto;

    let existingEntry = await checkExistingEntry(givenDto);
    if (!existingEntry) { // Create a new academic info entry
        const [newAcademicInfo] = await dbPostgres
            .insert(admissionAcademicInfo)
            .values(base)
            .returning();
        existingEntry = newAcademicInfo;
    }

    // Add the subjects to the academic info entry
    for (const subject of subjects) {
        subject.admissionAcademicInfoId = existingEntry.id;
        const { createdAt, updatedAt, ...subjectBase } = subject;
        await createSubject(subjectBase);
    }

    const dto = await formatAcademicInfo(existingEntry);

    return dto;
}

export async function findAcademicInfoById(id: number) {
    const [academicInfo] = await dbPostgres
        .select()
        .from(admissionAcademicInfo)
        .where(eq(admissionAcademicInfo.id, id));

    if (!academicInfo) {
        return null;
    }

    const dto = await formatAcademicInfo(academicInfo);

    return dto;
}

export async function findAcademicInfoByApplicationFormId(applicationFormId: number) {
    const [academicInfo] = await dbPostgres
        .select()
        .from(admissionAcademicInfo)
        .where(eq(admissionAcademicInfo.applicationFormId, applicationFormId));

    const dto = await formatAcademicInfo(academicInfo);

    return dto;
}

export async function updateAcademicInfo(givenDto: Omit<AdmissionAcademicInfoDto, "createdAt" | "updatedAt">) {
    const foundAcademicInfo = await findAcademicInfoById(givenDto.id!);
    if (!foundAcademicInfo) {
        return null;
    }
    const { subjects, id, ...base } = givenDto
    
    const [updatedAcademicInfo] = await dbPostgres
        .update(admissionAcademicInfo)
        .set(base)
        .where(eq(admissionAcademicInfo.id, givenDto.id!))
        .returning();
    
    // Delete existing subjects and create new ones
    for (const subject of foundAcademicInfo.subjects) {
        await deleteSubject(subject.id!);
    }
    
    // Create new subjects
    for (const subject of subjects) {
        subject.admissionAcademicInfoId = updatedAcademicInfo.id;
        const { createdAt, updatedAt, ...subjectBase } = subject;
        await createSubject(subjectBase);
    }
    
    const dto = await formatAcademicInfo(updatedAcademicInfo);
    return dto;
}

export async function deleteAcademicInfo(id: number) {
    const foundAcademicInfo = await findAcademicInfoById(id);
    if (!foundAcademicInfo) {
        return null;
    }
    // Delete the subjects associated with the academic info
    for (const subject of foundAcademicInfo.subjects) {
        await deleteSubject(subject.id!);
    }
    // Delete the academic info entry
    await dbPostgres
        .delete(admissionAcademicInfo)
        .where(eq(admissionAcademicInfo.id, id));

    return true;
}

export async function formatAcademicInfo(academicInfo: AdmissionAcademicInfo): Promise<AdmissionAcademicInfoDto | null> {
    if (!academicInfo) return null;
    const subjects = await findSubjectsByAcademicInfoId(academicInfo.id!);

    return {
        ...academicInfo,
        subjects: subjects || [],
    };
}

export async function checkExistingEntry(givenDto: AdmissionAcademicInfoDto) {
    const whereCondtions = [
        eq(admissionAcademicInfo.applicationFormId, givenDto.applicationFormId),
        eq(admissionAcademicInfo.boardUniversityId, givenDto.boardUniversityId),
        eq(admissionAcademicInfo.boardResultStatus, givenDto.boardResultStatus),
    ];

    if (typeof givenDto.cuRegistrationNumber === 'string' && givenDto.cuRegistrationNumber.trim() !== '') {
        whereCondtions.push(
            ilike(
                admissionAcademicInfo.cuRegistrationNumber,
                givenDto.cuRegistrationNumber.trim()
            )
        );
    }

    // if (typeof givenDto.streamType === 'string' && givenDto.streamType.trim() !== '') {
    //     whereCondtions.push(
    //         ilike(
    //             admissionAcademicInfo.streamType,
    //             givenDto.streamType.trim()
    //         )
    //     );
    // }

    const [existingEntry] = await dbPostgres
        .select()
        .from(admissionAcademicInfo)
        .where(and(...whereCondtions));

    return existingEntry;
}