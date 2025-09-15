import { db } from "@/db";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model";
import { and, desc, eq } from "drizzle-orm";
import * as programCourseService from "@/features/course-design/services/program-course.service";
import * as sessionService from "@/features/academics/services/session.service";
import {
  academicYearModel,
  admissionAcademicInfoModel,
  admissionCourseDetailsModel,
  admissionModel,
  admSubjectPaperSelectionModel,
  applicationFormModel,
  sectionModel,
  sessionModel,
  studentModel,
} from "@repo/db/schemas";
import * as classService from "@/features/academics/services/class.service";
import * as shiftService from "@/features/academics/services/shift.service";
import * as paperService from "@/features/course-design/services/paper.service";
import {
  paperModel,
  subjectModel,
  subjectTypeModel,
} from "@repo/db/schemas/models/course-design";
import * as relatedSubjectService from "@/features/subject-selection/services/related-subject-main.service";
import * as studentAcademicSubjectService from "@/features/admissions/services/student-academic-subject.service";
import { promotionStatusModel } from "@repo/db/schemas/models/batches/promotion-status.model";
import * as stringSimilarity from "string-similarity";

// Helper function for fuzzy string matching
function isSubjectMatch(
  subjectName1: string,
  subjectName2: string,
  threshold: number = 0.8,
): boolean {
  const clean1 = subjectName1
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "");
  const clean2 = subjectName2
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "");

  // First try exact match
  if (clean1 === clean2) return true;

  // Then try fuzzy matching
  const similarity = stringSimilarity.compareTwoStrings(clean1, clean2);
  return similarity >= threshold;
}

async function findPromotionByStudentId(studentId: number) {
  const [foundPromotion] = await db
    .select()
    .from(promotionModel)
    .where(eq(promotionModel.studentId, studentId))
    .orderBy(desc(promotionModel.id)); // Get the latest promotion

  const foundProgramCourse = await programCourseService.findById(
    foundPromotion?.programCourseId,
  );

  const foundSession = await sessionService.findById(foundPromotion?.sessionId);

  const [foundAcademicYear] = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.id, foundSession?.academicYearId!));

  const [foundSection] = await db
    .select()
    .from(sectionModel)
    .where(eq(sectionModel.id, foundPromotion?.sectionId));

  const foundClass = await classService.findClassById(foundPromotion?.classId);

  const foundShift = await shiftService.findById(foundPromotion?.shiftId);

  const foundPromotionStatus = await db
    .select()
    .from(promotionStatusModel)
    .where(eq(promotionStatusModel.id, foundPromotion?.promotionStatusId!));

  return {
    foundPromotion,
    foundProgramCourse,
    foundSession,
    foundAcademicYear,
    foundSection,
    foundClass,
    foundShift,
    foundPromotionStatus,
  };
}

export async function findSubjectsSelections(studentId: number) {
  const { foundProgramCourse, foundClass } =
    await findPromotionByStudentId(studentId);
  const { foundAdmAcademicInfo, foundAcademicYear } =
    await findHierarchy(studentId);

  const studentSubjects =
    await studentAcademicSubjectService.findSubjectsByAcademicInfoId(
      foundAdmAcademicInfo?.id,
    );

  const studentSelectedMinorSubjects = await db
    .select()
    .from(admSubjectPaperSelectionModel)
    .where(eq(admSubjectPaperSelectionModel.studentId, studentId));

  const selectedMinorDetailedList = await Promise.all(
    studentSelectedMinorSubjects.map(async (selection) => {
      const [foundPaper] = await db
        .select()
        .from(paperModel)
        .where(eq(paperModel.id, selection.paperId));

      return await paperService.modelToDetailedDto(foundPaper);
    }),
  );

  const formatedSelectedMinorSubjects = selectedMinorDetailedList.filter(
    (subject): subject is paperService.PaperDetailedDto => subject !== null,
  );

  // Fetch the related subjects for the program course
  const relatedSubjects =
    await relatedSubjectService.findByAcademicYearIdAndProgramCourseId(
      foundAcademicYear?.id,
      foundProgramCourse?.id!,
    );

  // Fetch the subject types for the academic year and program course
  const subjectTypeIds = (
    await db
      .select({
        subjectTypeId: paperModel.subjectTypeId,
      })
      .from(paperModel)
      .where(
        and(
          eq(paperModel.academicYearId, foundAcademicYear?.id),
          eq(paperModel.programCourseId, foundProgramCourse?.id!),
          eq(paperModel.classId, foundClass?.id!),
        ),
      )
      .groupBy(paperModel.subjectTypeId)
  ).map((paper) => paper.subjectTypeId);

  const studentSubjectsSelection = [];
  for (const subjectTypeId of subjectTypeIds) {
    const [foundSubjectType] = await db
      .select()
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.id, subjectTypeId));

    const papers = await db
      .select()
      .from(paperModel)
      .where(
        and(
          eq(paperModel.subjectTypeId, subjectTypeId),
          eq(paperModel.classId, foundClass?.id!),
          eq(paperModel.programCourseId, foundProgramCourse?.id!),
          eq(paperModel.academicYearId, foundAcademicYear?.id!),
        ),
      );

    const paperOptions = [];
    for (const paper of papers) {
      const [foundSubject] = await db
        .select()
        .from(subjectModel)
        .where(eq(subjectModel.id, paper.subjectId));

      // Fetch the subject which is common name in subject and board subject name
      const relatedSubjectMainDto = relatedSubjects.find(
        (rsbj) =>
          rsbj.subjectType.id === subjectTypeId &&
          isSubjectMatch(rsbj.boardSubjectName.name, foundSubject?.name || ""),
      );

      // Check the condition
      if (relatedSubjectMainDto) {
        for (const stdSubject of studentSubjects) {
          // If studied in 12th class, then check the result status
          if (
            stdSubject.boardSubject.boardSubjectName.id ===
            relatedSubjectMainDto.boardSubjectName.id
          ) {
            if (stdSubject.resultStatus === "PASS") {
              // If the subject is pass, then add the paper to the paper options
              const detailed = await paperService.modelToDetailedDto(paper);
              if (detailed) paperOptions.push(detailed);
            }
          } else {
            // Not studied in 12th class, then check the result status for the related subject-subs
            const isRelatedSubjectSubPass =
              relatedSubjectMainDto.relatedSubjectSubs.some(
                (sub) =>
                  isSubjectMatch(
                    sub.boardSubjectName.name,
                    stdSubject.boardSubject.boardSubjectName.name,
                  ) && stdSubject.resultStatus === "PASS",
              );

            // If any of the related subject-subs is pass, then add the paper to the paper options
            if (isRelatedSubjectSubPass) {
              const detailed = await paperService.modelToDetailedDto(paper);
              if (detailed) paperOptions.push(detailed);
            }
          }
        }
      } else {
        // No condition found
        const detailed = await paperService.modelToDetailedDto(paper);
        if (detailed) paperOptions.push(detailed);
      }
    }

    // Add the paper options to the student subjects selection
    studentSubjectsSelection.push({
      subjectType: foundSubjectType,
      paperOptions,
    });
  }

  return {
    studentSubjectsSelection,
    selectedMinorSubjects: formatedSelectedMinorSubjects,
  };
}

async function findHierarchy(studentId: number) {
  const [foundStudent] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.id, studentId));

  const [foundApplicationForm] = await db
    .select()
    .from(applicationFormModel)
    .where(eq(applicationFormModel.id, foundStudent?.applicationId!));

  const [foundAdmAcademicInfo] = await db
    .select()
    .from(admissionAcademicInfoModel)
    .where(
      eq(
        admissionAcademicInfoModel.applicationFormId,
        foundApplicationForm?.id,
      ),
    );

  const [foundAdmission] = await db
    .select()
    .from(admissionModel)
    .where(eq(admissionModel.id, foundApplicationForm?.admissionId!));

  const [foundSession] = await db
    .select()
    .from(sessionModel)
    .where(eq(sessionModel.id, foundAdmission?.sessionId!));

  const [foundAcademicYear] = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.id, foundSession?.academicYearId!));

  const [foundAdmCourseDetail] = await db
    .select()
    .from(admissionCourseDetailsModel)
    .where(
      and(
        eq(
          admissionCourseDetailsModel.applicationFormId,
          foundApplicationForm?.id,
        ),
        eq(admissionCourseDetailsModel.isTransferred, true),
      ),
    );

  return {
    foundStudent,
    foundAdmAcademicInfo,
    foundApplicationForm,
    foundAdmission,
    foundSession,
    foundAcademicYear,
    foundAdmCourseDetail,
  };
}
