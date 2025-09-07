import { db } from "@/db/index.js";
import {
  admissionAcademicInfoModel,
  AdmissionAcademicInfo,
} from "../models/admission-academic-info.model.js";
import { AdmissionAcademicInfoDto } from "@/types/admissions/index.js";
type AcademicInfoInsert = typeof admissionAcademicInfoModel.$inferInsert;
import { and, eq, ilike } from "drizzle-orm";
// import { createSubject, getAllSubjects, getSubjectById } from "./academic-subject.service.js";

import {
  createSubject,
  deleteSubject,
  findSubjectsByAcademicInfoId,
} from "./student-academic-subject.service.js";

// CREATE
export async function createAcademicInfo(givenDto: AdmissionAcademicInfoDto) {
  const { subjects, createdAt, updatedAt, ...rest } = givenDto as any;

  const insertValue: AcademicInfoInsert = {
    applicationFormId: Number(rest.applicationFormId),
    boardUniversityId: Number(rest.boardUniversityId),
    boardResultStatus: rest.boardResultStatus,
    rollNumber: rest.rollNumber ?? undefined,
    schoolNumber: rest.schoolNumber ?? undefined,
    centerNumber: rest.centerNumber ?? undefined,
    admitCardId: rest.admitCardId ?? undefined,
    instituteId: rest.instituteId ?? undefined,
    otherInstitute: rest.otherInstitute ?? undefined,
    languageMediumId: Number(rest.languageMediumId),
    yearOfPassing: Number(rest.yearOfPassing),
    streamType: rest.streamType,
    isRegisteredForUGInCU: !!rest.isRegisteredForUGInCU,
    cuRegistrationNumber: rest.cuRegistrationNumber ?? undefined,
    previouslyRegisteredCourseId:
      rest.previouslyRegisteredCourseId ?? undefined,
    otherPreviouslyRegisteredCourse:
      rest.otherPreviouslyRegisteredCourse ?? undefined,
    previousCollegeId: rest.previousCollegeId ?? undefined,
    otherCollege: rest.otherCollege ?? undefined,
  };

  let existingEntry = await checkExistingEntry(givenDto);
  if (!existingEntry) {
    const [newAcademicInfo] = await db
      .insert(admissionAcademicInfoModel)
      .values(insertValue)
      .returning();
    existingEntry = newAcademicInfo;
  }

  for (const subject of subjects) {
    const subjectBase = {
      admissionAcademicInfoId: Number(existingEntry.id!),
      academicSubjectId: Number((subject as any).academicSubjectId),
      fullMarks: String((subject as any).fullMarks ?? ""),
      totalMarks: String((subject as any).totalMarks ?? ""),
      resultStatus: (subject as any).resultStatus ?? undefined,
    };
    await createSubject(subjectBase as any);
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
export async function findAcademicInfoByApplicationFormId(
  applicationFormId: number,
) {
  const [academicInfo] = await db
    .select()
    .from(admissionAcademicInfoModel)
    .where(
      eq(
        admissionAcademicInfoModel.applicationFormId,
        Number(applicationFormId),
      ),
    );

  if (!academicInfo) return null;
  return await formatAcademicInfo(academicInfo);
}

// UPDATE
export async function updateAcademicInfo(
  givenDto: Omit<AdmissionAcademicInfoDto, "createdAt" | "updatedAt">,
) {
  const foundAcademicInfo = await findAcademicInfoById(givenDto.id!);
  if (!foundAcademicInfo) return null;

  const { subjects, id, ...rest } = givenDto as any;
  const base = {
    applicationFormId: Number(rest.applicationFormId),
    boardUniversityId: Number(rest.boardUniversityId),
    boardResultStatus: rest.boardResultStatus,
    rollNumber: rest.rollNumber ?? undefined,
    schoolNumber: rest.schoolNumber ?? undefined,
    centerNumber: rest.centerNumber ?? undefined,
    admitCardId: rest.admitCardId ?? undefined,
    instituteId: rest.instituteId ?? undefined,
    otherInstitute: rest.otherInstitute ?? undefined,
    languageMediumId: Number(rest.languageMediumId),
    yearOfPassing: Number(rest.yearOfPassing),
    streamType: rest.streamType,
    isRegisteredForUGInCU: !!rest.isRegisteredForUGInCU,
    cuRegistrationNumber: rest.cuRegistrationNumber ?? undefined,
    previouslyRegisteredCourseId:
      rest.previouslyRegisteredCourseId ?? undefined,
    otherPreviouslyRegisteredCourse:
      rest.otherPreviouslyRegisteredCourse ?? undefined,
    previousCollegeId: rest.previousCollegeId ?? undefined,
    otherCollege: rest.otherCollege ?? undefined,
  };

  const [updatedAcademicInfo] = await db
    .update(admissionAcademicInfoModel)
    .set(base)
    .where(eq(admissionAcademicInfoModel.id, givenDto.id!))
    .returning();

  // Delete existing subjects and create new ones
  for (const subject of foundAcademicInfo.subjects) {
    await deleteSubject(Number(subject.id));
  }
  for (const subject of subjects) {
    const subjectBase = {
      admissionAcademicInfoId: Number(updatedAcademicInfo.id!),
      academicSubjectId: Number((subject as any).academicSubjectId),
      fullMarks: String((subject as any).fullMarks ?? ""),
      totalMarks: String((subject as any).totalMarks ?? ""),
      resultStatus: (subject as any).resultStatus ?? undefined,
    };
    await createSubject(subjectBase as any);
  }

  return await formatAcademicInfo(updatedAcademicInfo);
}

// DELETE
export async function deleteAcademicInfo(id: number) {
  const foundAcademicInfo = await findAcademicInfoById(Number(id));
  if (!foundAcademicInfo) return null;

  for (const subject of foundAcademicInfo.subjects) {
    await deleteSubject(Number(subject.id!));
  }
  await db
    .delete(admissionAcademicInfoModel)
    .where(eq(admissionAcademicInfoModel.id, Number(id)));

  return true;
}

// FORMAT DTO
export async function formatAcademicInfo(
  academicInfo: AdmissionAcademicInfo,
): Promise<AdmissionAcademicInfoDto | null> {
  if (!academicInfo) return null;
  if (academicInfo.id == null) {
    throw new Error("AdmissionAcademicInfo id is required to load subjects");
  }
  const subjects = await findSubjectsByAcademicInfoId(
    academicInfo.id as number,
  );
  return {
    ...academicInfo,
    subjects: subjects || [],
  };
}

// CHECK EXISTING
export async function checkExistingEntry(givenDto: AdmissionAcademicInfoDto) {
  const whereConditions = [
    eq(
      admissionAcademicInfoModel.applicationFormId,
      Number((givenDto as any).applicationFormId),
    ),
    eq(
      admissionAcademicInfoModel.boardUniversityId,
      Number((givenDto as any).boardUniversityId),
    ),
    eq(
      admissionAcademicInfoModel.boardResultStatus,
      (givenDto as any).boardResultStatus,
    ),
  ];

  if (
    typeof givenDto.cuRegistrationNumber === "string" &&
    givenDto.cuRegistrationNumber.trim() !== ""
  ) {
    whereConditions.push(
      ilike(
        admissionAcademicInfoModel.cuRegistrationNumber,
        givenDto.cuRegistrationNumber.trim(),
      ),
    );
  }

  const [existingEntry] = await db
    .select()
    .from(admissionAcademicInfoModel)
    .where(and(...whereConditions));

  return existingEntry;
}
