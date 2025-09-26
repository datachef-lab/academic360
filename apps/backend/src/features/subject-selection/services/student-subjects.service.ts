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
import { classModel } from "@repo/db/schemas/models/academics";
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
import { PaperDetailedDto } from "@/features/course-design/services/paper.service";

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
    .where(eq(sectionModel.id, foundPromotion?.sectionId!));

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

  // Parallel fetch of all required data
  const [
    studentSubjects,
    studentSelectedMinorSubjects,
    relatedSubjects,
    subjectTypesWithPapers,
  ] = await Promise.all([
    studentAcademicSubjectService.findSubjectsByAcademicInfoId(
      foundAdmAcademicInfo?.id,
    ),
    db
      .select()
      .from(admSubjectPaperSelectionModel)
      .where(eq(admSubjectPaperSelectionModel.studentId, studentId)),
    relatedSubjectService.findByAcademicYearIdAndProgramCourseId(
      foundAcademicYear?.id,
      foundProgramCourse?.id!,
    ),
    // Optimized query: Get all subject types with their papers in one query
    db
      .select({
        subjectType: subjectTypeModel,
        paper: paperModel,
        subject: subjectModel,
        class: classModel,
      })
      .from(paperModel)
      .leftJoin(
        subjectTypeModel,
        eq(paperModel.subjectTypeId, subjectTypeModel.id),
      )
      .leftJoin(subjectModel, eq(paperModel.subjectId, subjectModel.id))
      .leftJoin(classModel, eq(paperModel.classId, classModel.id))
      .where(
        and(
          eq(paperModel.academicYearId, foundAcademicYear?.id),
          eq(paperModel.programCourseId, foundProgramCourse?.id!),
          eq(paperModel.isActive, true),
          eq(paperModel.isOptional, true),
        ),
      ),
  ]);

  // Process selected minor subjects in parallel
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

  // Group papers by subject type
  const papersBySubjectType = new Map<number, any[]>();
  for (const row of subjectTypesWithPapers) {
    if (!row.subjectType) continue;

    const subjectTypeId = row.subjectType.id;
    if (!papersBySubjectType.has(subjectTypeId)) {
      papersBySubjectType.set(subjectTypeId, []);
    }
    papersBySubjectType.get(subjectTypeId)!.push({
      paper: row.paper,
      subject: row.subject,
      class: row.class,
      subjectType: row.subjectType,
    });
  }

  const studentSubjectsSelection = [];
  for (const [subjectTypeId, papers] of papersBySubjectType) {
    const subjectType = papers[0].subjectType;
    let paperOptions: PaperDetailedDto[] = [];

    for (const { paper, subject } of papers) {
      // Fetch the subject which is common name in subject and board subject name
      const relatedSubjectMainDto = relatedSubjects.find(
        (rsbj) =>
          rsbj.subjectType.id === subjectTypeId &&
          isSubjectMatch(rsbj.boardSubjectName.name, subject?.name || ""),
      );
      console.log(
        "relatedSubjectMainDto",
        relatedSubjectMainDto,
        "subject?.name:",
        subject?.name,
      );
      // Check the condition
      if (relatedSubjectMainDto) {
        for (const stdSubject of studentSubjects) {
          // If studied in 12th class, then check the result status
          console.log(
            "// If studied in 12th class, then check the result status:",
            stdSubject.boardSubject.boardSubjectName.name,
            relatedSubjectMainDto.boardSubjectName.name,
          );
          if (
            isSubjectMatch(
              stdSubject.boardSubject.boardSubjectName.name,
              relatedSubjectMainDto.boardSubjectName.name,
            )
          ) {
            if (
              stdSubject.resultStatus === "PASS" &&
              !["AEC", "IDC"].includes(subjectType.code || "")
            ) {
              // If the subject is pass, then add the paper to the paper options
              const detailed = await paperService.modelToDetailedDto(paper);
              console.log(
                "adding the paper to the paper options",
                detailed?.subject.name,
              );
              if (detailed) paperOptions.push(detailed);
            } else {
              console.log(
                "filtering the paper from the paper options",
                paper.subjectId,
              );
              paperOptions = paperOptions.filter(
                (p) => p.subject.id !== paper.subjectId,
              );
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
              console.log(
                "adding the paper to the paper options by related subject subs:",
                detailed?.subject.name,
              );
              if (detailed) paperOptions.push(detailed);
            }
          }
        }
      } else {
        // No condition found
        // console.log("// No condition found", s.boardSubject.boardSubjectName.name, subject?.name);
        const detailed = await paperService.modelToDetailedDto(paper);
        // Use fuzzy name matching instead of strict equality
        const studentSubject = detailed
          ? studentSubjects.find((el) =>
              isSubjectMatch(
                el?.boardSubject?.boardSubjectName?.name ?? "",
                detailed?.subject?.name ?? "",
              ),
            )
          : undefined;
        if (
          studentSubject &&
          !["AEC", "IDC"].includes(detailed?.subjectType.code || "")
        ) {
          if (studentSubject.resultStatus === "PASS") {
            if (detailed) paperOptions.push(detailed);
          }
        } else {
          if (detailed) paperOptions.push(detailed);
        }
      }
    }

    // Add the paper options to the student subjects selection
    studentSubjectsSelection.push({
      subjectType,
      paperOptions,
    });
  }

  const arr: PaperDetailedDto[] = [];
  for (const subject of formatedSelectedMinorSubjects) {
    if (arr.find((s) => s.id === subject.id)) {
      arr.push(subject);
    }
  }

  return {
    studentSubjectsSelection,
    selectedMinorSubjects: arr, // Give distinct list of selected minor subjects based on legacy id
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
