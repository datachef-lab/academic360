import { db } from "@/db/index.js";
import {
  admissionAcademicInfoModel,
  AdmissionAcademicInfo,
  studentAcademicSubjectModel,
  boardSubjectModel,
} from "@repo/db/schemas/models/admissions";
import { boardModel } from "@repo/db/schemas";
import { AdmissionAcademicInfoDto } from "@repo/db/dtos/admissions";
type AcademicInfoInsert = typeof admissionAcademicInfoModel.$inferInsert;
import { and, eq, ilike } from "drizzle-orm";
// import { createSubject, getAllSubjects, getSubjectById } from "./academic-subject.service.js";

import {
  createSubject,
  deleteSubject,
  findSubjectsByAcademicInfoId,
  updateSubject,
} from "./student-academic-subject.service.js";
import {
  addAddress,
  saveAddress,
} from "../../user/services/address.service.js";

// CREATE
export async function createAcademicInfo(givenDto: AdmissionAcademicInfoDto) {
  const { subjects, createdAt, updatedAt, ...rest } = givenDto as any;

  const insertValue: AcademicInfoInsert = {
    applicationFormId: Number(rest.applicationFormId),
    boardId: Number(rest.boardId ?? rest.boardUniversityId),
    boardResultStatus: rest.boardResultStatus,
    percentageOfMarks:
      rest.percentageOfMarks == null || rest.percentageOfMarks === ""
        ? undefined
        : Number(rest.percentageOfMarks),
    lastSchoolName:
      typeof rest.lastSchoolName === "string" ? rest.lastSchoolName : undefined,
    rollNumber: rest.rollNumber ?? undefined,
    schoolNumber: rest.schoolNumber ?? undefined,
    centerNumber: rest.centerNumber ?? undefined,
    admitCardId: rest.admitCardId ?? undefined,
    languageMediumId:
      rest.languageMediumId == null || rest.languageMediumId === ""
        ? undefined
        : Number(rest.languageMediumId),
    yearOfPassing: Number(rest.yearOfPassing),
    specializationId:
      rest.specializationId != null ? Number(rest.specializationId) : undefined,
    isRegisteredForUGInCU: !!rest.isRegisteredForUGInCU,
    cuRegistrationNumber: rest.cuRegistrationNumber ?? undefined,
    previouslyRegisteredProgramCourseId:
      rest.previouslyRegisteredProgramCourseId != null
        ? Number(rest.previouslyRegisteredProgramCourseId)
        : undefined,
    otherPreviouslyRegisteredProgramCourse:
      typeof rest.otherPreviouslyRegisteredProgramCourse === "string"
        ? rest.otherPreviouslyRegisteredProgramCourse
        : undefined,
    previousInstituteId:
      rest.previousInstituteId != null
        ? Number(rest.previousInstituteId)
        : undefined,
    otherPreviousInstitute:
      typeof rest.otherPreviousInstitute === "string"
        ? rest.otherPreviousInstitute
        : undefined,
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
      boardSubjectId: Number(
        (subject as any).boardSubjectId ??
          (subject as any).boardSubject?.id ??
          0,
      ),
      theoryMarks: Number((subject as any).theoryMarks ?? 0),
      practicalMarks: Number((subject as any).practicalMarks ?? 0),
      totalMarks: Number((subject as any).totalMarks ?? 0),
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
  const { subjects, id, ...rest } = givenDto as any;

  const safeEnum = (
    v: unknown,
  ): "PASS" | "FAIL" | "COMPARTMENTAL" | undefined => {
    const s = typeof v === "string" ? v.trim().toUpperCase() : undefined;
    return s === "PASS" || s === "FAIL" || s === "COMPARTMENTAL"
      ? (s as any)
      : undefined;
  };
  const toNum = (v: unknown): number | undefined =>
    v == null ? undefined : Number.isFinite(Number(v)) ? Number(v) : undefined;

  const base: Record<string, unknown> = {};
  const brs = safeEnum(rest.boardResultStatus);
  if (brs) base.boardResultStatus = brs;
  const yop = toNum(rest.yearOfPassing);
  if (yop != null) base.yearOfPassing = yop;
  if (typeof rest.isRegisteredForUGInCU === "boolean")
    base.isRegisteredForUGInCU = rest.isRegisteredForUGInCU;
  const bId = toNum((rest as any).boardId ?? (rest as any).boardUniversityId);
  if (bId != null) base.boardId = bId;
  if (typeof (rest as any).lastSchoolName === "string")
    base.lastSchoolName = (rest as any).lastSchoolName;
  // New: allow updating optional textual fields
  if (typeof (rest as any).otherBoard === "string")
    base.otherBoard = (rest as any).otherBoard;
  if (typeof (rest as any).division === "string")
    base.division = (rest as any).division;
  const rankVal = toNum((rest as any).rank);
  if (rankVal != null) base.rank = rankVal;
  if (typeof (rest as any).subjectStudied === "string")
    base.subjectStudied = (rest as any).subjectStudied;
  if (typeof (rest as any).indexNumber1 === "string")
    base.indexNumber1 = (rest as any).indexNumber1;
  if (typeof (rest as any).indexNumber2 === "string")
    base.indexNumber2 = (rest as any).indexNumber2;
  const studiedUpTo = toNum((rest as any).studiedUpToClass);
  if (studiedUpTo != null) base.studiedUpToClass = studiedUpTo;
  const bestOfFour = toNum((rest as any).bestOfFour);
  if (bestOfFour != null) base.bestOfFour = bestOfFour;
  const bestOfFive = toNum((rest as any).bestOfFive);
  if (bestOfFive != null) base.bestOfFive = bestOfFive;
  const oldBestOfFour = toNum((rest as any).oldBestOfFour);
  if (oldBestOfFour != null) base.oldBestOfFour = oldBestOfFour;
  if (typeof rest.rollNumber === "string") base.rollNumber = rest.rollNumber;
  if (typeof rest.schoolNumber === "string")
    base.schoolNumber = rest.schoolNumber;
  if (typeof (rest as any).registrationNumber === "string")
    base.registrationNumber = (rest as any).registrationNumber;
  if (typeof rest.centerNumber === "string")
    base.centerNumber = rest.centerNumber;
  if (typeof (rest as any).previousRegistrationNumber === "string")
    base.previousRegistrationNumber = (rest as any).previousRegistrationNumber;
  if (typeof (rest as any).examNumber === "string")
    base.examNumber = (rest as any).examNumber;
  const oldTotal = toNum((rest as any).oldTotalScore);
  if (oldTotal != null) base.oldTotalScore = oldTotal;
  if (typeof rest.admitCardId === "string") base.admitCardId = rest.admitCardId;
  if (typeof rest.cuRegistrationNumber === "string")
    base.cuRegistrationNumber = rest.cuRegistrationNumber;
  const pom = toNum((rest as any).percentageOfMarks);
  if (pom != null) base.percentageOfMarks = pom;
  const lmId = toNum(rest.languageMediumId);
  if (lmId != null && lmId > 0) base.languageMediumId = lmId;
  const specId = toNum((rest as any).specializationId);
  if (specId != null) base.specializationId = specId;
  const prgId = toNum((rest as any).previouslyRegisteredProgramCourseId);
  if (prgId != null) base.previouslyRegisteredProgramCourseId = prgId;
  if (typeof (rest as any).otherPreviouslyRegisteredProgramCourse === "string")
    base.otherPreviouslyRegisteredProgramCourse = (
      rest as any
    ).otherPreviouslyRegisteredProgramCourse;
  const prevInstId = toNum((rest as any).previousInstituteId);
  if (prevInstId != null) base.previousInstituteId = prevInstId;
  if (typeof (rest as any).otherPreviousInstitute === "string")
    base.otherPreviousInstitute = (rest as any).otherPreviousInstitute;

  // Handle studentId for student reference academic info
  const studentId = toNum((rest as any).studentId);
  if (studentId != null) base.studentId = studentId;

  // Intentionally avoid updating applicationFormId and boardId to prevent FK/constraint issues

  // Hydrate missing required fields from existing row to satisfy DB constraints
  const [existingRow] = await db
    .select()
    .from(admissionAcademicInfoModel)
    .where(eq(admissionAcademicInfoModel.id, Number(givenDto.id)));
  if (!existingRow) return null;
  if (base.boardResultStatus == null)
    base.boardResultStatus = existingRow.boardResultStatus as unknown as string;
  if (base.yearOfPassing == null)
    base.yearOfPassing = existingRow.yearOfPassing as unknown as number;
  if (base.isRegisteredForUGInCU == null)
    base.isRegisteredForUGInCU =
      existingRow.isRegisteredForUGInCU as unknown as boolean;
  if (base.languageMediumId == null)
    base.languageMediumId = existingRow.languageMediumId as unknown as number;
  if (
    base.specializationId == null &&
    (existingRow as any).specializationId != null
  )
    base.specializationId = (existingRow as any)
      .specializationId as unknown as number;
  if (
    base.previousInstituteId == null &&
    (existingRow as any).previousInstituteId != null
  )
    base.previousInstituteId = (existingRow as any)
      .previousInstituteId as unknown as number;
  if (
    base.previouslyRegisteredProgramCourseId == null &&
    (existingRow as any).previouslyRegisteredProgramCourseId != null
  )
    base.previouslyRegisteredProgramCourseId = (existingRow as any)
      .previouslyRegisteredProgramCourseId as unknown as number;

  // Handle lastSchoolAddress creation/update
  if (rest.lastSchoolAddress) {
    const addressData = rest.lastSchoolAddress as any;
    let addressId: number | null = null;

    if (existingRow.lastSchoolAddress) {
      // Update existing address
      const updatedAddress = await saveAddress(existingRow.lastSchoolAddress, {
        id: existingRow.lastSchoolAddress,
        countryId: addressData.country?.id || null,
        stateId: addressData.state?.id || null,
        cityId: addressData.city?.id || null,
        districtId: addressData.district?.id || null,
        addressLine: addressData.addressLine || null,
        landmark: addressData.landmark || null,
        localityType: addressData.localityType || null,
        pincode: addressData.pincode || null,
        phone: addressData.phone || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      addressId = updatedAddress?.id || null;
    } else {
      // Create new address
      const newAddress = await addAddress({
        countryId: addressData.country?.id || null,
        stateId: addressData.state?.id || null,
        cityId: addressData.city?.id || null,
        districtId: addressData.district?.id || null,
        addressLine: addressData.addressLine || null,
        landmark: addressData.landmark || null,
        localityType: addressData.localityType || null,
        pincode: addressData.pincode || null,
        phone: addressData.phone || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      addressId = newAddress?.id || null;
    }

    if (addressId) {
      base.lastSchoolAddress = addressId;
    }
  }

  // Authoritatively (re)compute Best of Four / Five from the subjects being
  // saved: the average of the best 4 / best 5 subject totals.
  if (Array.isArray(subjects) && subjects.length > 0) {
    const totals = (subjects as any[])
      .map((s) => Number(s?.totalMarks ?? 0))
      .filter((t) => t > 0)
      .sort((a, b) => b - a);
    if (totals.length > 0) {
      const avgTopN = (n: number) => {
        const top = totals.slice(0, n);
        return (
          Math.round((top.reduce((a, b) => a + b, 0) / top.length) * 100) / 100
        );
      };
      base.bestOfFour = avgTopN(4);
      base.bestOfFive = avgTopN(5);
    }
  }

  let updatedAcademicInfo;
  try {
    [updatedAcademicInfo] = await db
      .update(admissionAcademicInfoModel)
      .set(base)
      .where(eq(admissionAcademicInfoModel.id, givenDto.id!))
      .returning();
  } catch (error) {
    console.error("AcademicInfo update failed with payload:", base);
    console.error("PG error:", {
      message: (error as any)?.message,
      detail: (error as any)?.detail,
      code: (error as any)?.code,
    });
    throw error;
  }

  if (!updatedAcademicInfo) {
    return null; // nothing updated => not found
  }

  // Upsert subjects: update existing (by id) or insert if new. Do not delete any.
  for (const subject of subjects as any[]) {
    const resolvedBoardSubjectId = Number(
      subject.boardSubjectId ??
        subject.boardSubject?.id ??
        subject.academicSubjectId ??
        0,
    );
    if (
      !Number.isFinite(resolvedBoardSubjectId) ||
      resolvedBoardSubjectId <= 0
    ) {
      // Skip invalid subject rows
      continue;
    }

    const theory = Number(subject.theoryMarks ?? 0);
    const practical = Number(subject.practicalMarks ?? 0);
    const total = Number.isFinite(Number(subject.totalMarks))
      ? Number(subject.totalMarks)
      : theory + practical;

    // Determine result status. If not provided, auto-calc from board subject's passing marks (if available)
    // board_result_status_type, not the two-value board_result_type. The wrong
    // union here is what let ABSENT/COMPARTMENTAL through and blocked the two
    // component-specific failures.
    let rs:
      | "PASS"
      | "FAIL IN THEORY"
      | "FAIL IN PRACTICAL"
      | "FAIL"
      | undefined;
    const rsRaw =
      typeof subject.resultStatus === "string"
        ? subject.resultStatus.trim().toUpperCase()
        : undefined;
    // Must mirror board_result_status_type exactly. The old allowlist admitted
    // ABSENT and COMPARTMENTAL — neither exists in this enum, so either would
    // have raised a PG error — while rejecting FAIL IN THEORY and FAIL IN
    // PRACTICAL, which do exist and which the console offers. Those two fell
    // through to the else-branch and were silently downgraded to PASS/FAIL.
    const allowedResults = new Set([
      "PASS",
      "FAIL IN THEORY",
      "FAIL IN PRACTICAL",
      "FAIL",
    ]);
    if (rsRaw && allowedResults.has(rsRaw)) {
      rs = rsRaw as any;
    } else {
      const [bs] = await db
        .select()
        .from(boardSubjectModel)
        .where(eq(boardSubjectModel.id, resolvedBoardSubjectId));

      // A component counts only if the board examines it (full marks > 0) AND
      // states a pass mark for it. `Number.isFinite(0)` is true, so treating a
      // pass mark of 0 as a live rule made `theory >= 0` pass everyone — most
      // mappings carry 0 because the legacy importer never had real marks.
      const theoryJudgeable =
        Number(bs?.fullMarksTheory ?? 0) > 0 &&
        Number(bs?.passingMarksTheory ?? 0) > 0;
      const practicalJudgeable =
        Number(bs?.fullMarksPractical ?? 0) > 0 &&
        Number(bs?.passingMarksPractical ?? 0) > 0;

      if (theoryJudgeable || practicalJudgeable) {
        const theoryFailed =
          theoryJudgeable && theory < Number(bs?.passingMarksTheory ?? 0);
        const practicalFailed =
          practicalJudgeable &&
          practical < Number(bs?.passingMarksPractical ?? 0);

        rs =
          theoryFailed && practicalFailed
            ? "FAIL"
            : theoryFailed
              ? "FAIL IN THEORY"
              : practicalFailed
                ? "FAIL IN PRACTICAL"
                : "PASS";
      }
    }

    const base = {
      admissionAcademicInfoId: Number(updatedAcademicInfo.id!),
      boardSubjectId: resolvedBoardSubjectId,
      theoryMarks: Number.isFinite(theory) ? theory : 0,
      practicalMarks: Number.isFinite(practical) ? practical : 0,
      totalMarks: Number.isFinite(total) ? total : 0,
      resultStatus: rs,
    } as any;

    if (subject.id) {
      await updateSubject({ id: Number(subject.id), ...base });
    } else {
      await createSubject(base);
    }
  }

  return await formatAcademicInfo(updatedAcademicInfo);
}

// DELETE
export async function deleteAcademicInfo(id: number) {
  const foundAcademicInfo = await findAcademicInfoById(Number(id));
  if (!foundAcademicInfo) return null;

  if (foundAcademicInfo.subjects) {
    for (const subject of foundAcademicInfo.subjects) {
      await deleteSubject(Number(subject.id!));
    }
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

  // Load related entities
  const { ...rest } = academicInfo as any;

  // For now, return null for related entities as they would require additional queries
  // This is a simplified version to fix the immediate type error
  return {
    ...rest,
    applicationForm: null,
    board: null,
    lastSchoolAddress: null,
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
      admissionAcademicInfoModel.boardId,
      Number((givenDto as any).boardId ?? (givenDto as any).boardUniversityId),
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
