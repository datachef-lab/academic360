import { db } from "@/db";
import { and, desc, eq, sql, max, inArray } from "drizzle-orm";
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
import { studentSubjectSelectionModel } from "@repo/db/schemas/models/subject-selection/student-subject-selection.model";
// import { subjectSelectionMetaModel } from "@repo/db/schemas/models/subject-selection/subject-selection-meta.model";
// import { subjectModel } from "@repo/db/schemas/models/course-design";
import { classModel } from "@repo/db/schemas/models/academics";
import * as classService from "@/features/academics/services/class.service";
import * as shiftService from "@/features/academics/services/shift.service";
import * as paperService from "@/features/course-design/services/paper.service";
import {
  paperModel,
  subjectModel,
  subjectTypeModel,
} from "@repo/db/schemas/models/course-design";
import { promotionModel } from "@repo/db/schemas/models/batches";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import * as relatedSubjectService from "@/features/subject-selection/services/related-subject-main.service";
import * as studentAcademicSubjectService from "@/features/admissions/services/student-academic-subject.service";
import { promotionStatusModel } from "@repo/db/schemas/models/batches/promotion-status.model";
import * as stringSimilarity from "string-similarity";
import { PaperDetailedDto } from "@/features/course-design/services/paper.service";
import {
  subjectSelectionMetaModel,
  subjectSelectionMetaStreamModel,
  subjectSelectionMetaClassModel,
} from "@repo/db/schemas/models/subject-selection";
import { streamModel } from "@repo/db/schemas/models/course-design";
import { SubjectSelectionMetaDto } from "@repo/db/dtos/subject-selection";

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
  try {
    const { foundProgramCourse, foundClass, foundSession } =
      await findPromotionByStudentId(studentId);
    const [foundAcademicYear] = await db
      .select()
      .from(academicYearModel)
      .where(eq(academicYearModel.id, foundSession?.academicYearId!));
    // console.log("foundAcademicYear:", foundAcademicYear);
    const { foundAdmAcademicInfo } = await findHierarchy(studentId);

    // Resolve keys used for lookups and guard early to avoid 500s
    const resolvedAcademicYearId =
      foundSession?.academicYearId || foundAcademicYear?.id;
    const resolvedProgramCourseId = foundProgramCourse?.id;
    if (!resolvedAcademicYearId || !resolvedProgramCourseId) {
      //   console.warn("[subject-selection] Missing AY/ProgramCourse for student", {
      //     studentId,
      //     resolvedAcademicYearId,
      //     resolvedProgramCourseId,
      //   });
      return {
        studentSubjectsSelection: [],
        selectedMinorSubjects: [],
        subjectSelectionMetas: [],
        hasFormSubmissions: false,
        actualStudentSelections: [],
        session: foundSession,
      };
    }

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
        resolvedAcademicYearId,
        resolvedProgramCourseId,
      ),
      // Optimized query: Get all subject types with their papers in one query
      (() => {
        const ayId = resolvedAcademicYearId;
        const pcId = resolvedProgramCourseId;
        console.log("[subject-selection] paper fetch filters ->", {
          academicYearId: ayId,
          programCourseId: pcId,
        });
        return db
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
              eq(paperModel.academicYearId, ayId as number),
              eq(paperModel.programCourseId, pcId),
              eq(paperModel.isActive, true),
              eq(paperModel.isOptional, true),
            ),
          );
      })(),
    ]);

    // console.log(studentSubjects,
    //     studentSelectedMinorSubjects,
    //     relatedSubjects,
    //     subjectTypesWithPapers)

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
      //   console.log("row:", row);
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
        // console.log(
        //   "relatedSubjectMainDto",
        //   relatedSubjectMainDto,
        //   "subject?.name:",
        //   subject?.name,
        // );
        // Check the condition
        if (relatedSubjectMainDto) {
          for (const stdSubject of studentSubjects) {
            // If studied in 12th class, then check the result status
            // console.log(
            //   "// If studied in 12th class, then check the result status:",
            //   stdSubject.boardSubject.boardSubjectName.name,
            //   relatedSubjectMainDto.boardSubjectName.name,
            // );
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
                // console.log(
                //   "adding the paper to the paper options",
                //   detailed?.subject.name,
                // );
                if (detailed) paperOptions.push(detailed);
              } else {
                // console.log(
                //   "filtering the paper from the paper options",
                //   paper.subjectId,
                // );
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
                // console.log(
                //   "adding the paper to the paper options by related subject subs:",
                //   detailed?.subject.name,
                // );
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

    //   const arr: PaperDetailedDto[] = [];
    //   for (const subject of formatedSelectedMinorSubjects) {
    //     if (arr.find((s) => s.id === subject.id)) {
    //       arr.push(subject);
    //     }
    //   }

    // Extract unique subject type IDs and stream IDs
    // Prefer deriving from available papers (papersBySubjectType) to avoid empty lists
    // when paperOptions were filtered out earlier.
    const subjectTypeIds = Array.from(
      new Set(
        (studentSubjectsSelection.length > 0
          ? studentSubjectsSelection.map((g) => g.subjectType.id)
          : Array.from(papersBySubjectType.keys())) as number[],
      ),
    );

    // Get stream IDs from the program course
    const streamIds = foundProgramCourse?.stream?.id
      ? [foundProgramCourse.stream.id]
      : [];

    // Fetch subject selection meta data
    // console.log("foundAcademicYear:", foundAcademicYear);
    const subjectSelectionMetas = await fetchSubjectSelectionMetaData(
      foundAcademicYear.id,
      subjectTypeIds,
      streamIds,
    );
    // console.log("[subject-selection] metas resolved ->", {
    //   academicYearId: foundAcademicYear?.id,
    //   subjectTypeIds,
    //   streamIds,
    //   metasCount: subjectSelectionMetas.length,
    // });

    // Check if student has actually submitted subject selections through the form
    // (not just admission selections)
    // Get only the latest version for each subject category (subjectSelectionMetaId)
    const [actualStudentSelections] = await Promise.all([
      db
        .select({
          id: studentSubjectSelectionModel.id,
          sessionId: studentSubjectSelectionModel.sessionId,
          subjectSelectionMetaId:
            studentSubjectSelectionModel.subjectSelectionMetaId,
          studentId: studentSubjectSelectionModel.studentId,
          subjectId: studentSubjectSelectionModel.subjectId,
          version: studentSubjectSelectionModel.version,
          parentId: studentSubjectSelectionModel.parentId,
          isDeprecated: studentSubjectSelectionModel.isDeprecated,
          isActive: studentSubjectSelectionModel.isActive,
          createdBy: studentSubjectSelectionModel.createdBy,
          changeReason: studentSubjectSelectionModel.changeReason,
          createdAt: studentSubjectSelectionModel.createdAt,
          updatedAt: studentSubjectSelectionModel.updatedAt,
          // Subject fields
          subjectModelId: subjectModel.id,
          subjectName: subjectModel.name,
          subjectCode: subjectModel.code,
          // Meta fields
          metaId: subjectSelectionMetaModel.id,
          metaLabel: subjectSelectionMetaModel.label,
          metaSubjectTypeId: subjectSelectionMetaModel.subjectTypeId,
          metaAcademicYearId: subjectSelectionMetaModel.academicYearId,
          // Subject type fields
          subjectTypeId: subjectTypeModel.id,
          subjectTypeName: subjectTypeModel.name,
          subjectTypeCode: subjectTypeModel.code,
        })
        .from(studentSubjectSelectionModel)
        .leftJoin(
          subjectModel,
          eq(studentSubjectSelectionModel.subjectId, subjectModel.id),
        )
        .leftJoin(
          subjectSelectionMetaModel,
          eq(
            studentSubjectSelectionModel.subjectSelectionMetaId,
            subjectSelectionMetaModel.id,
          ),
        )
        .leftJoin(
          subjectTypeModel,
          eq(subjectSelectionMetaModel.subjectTypeId, subjectTypeModel.id),
        )
        .where(
          and(
            eq(studentSubjectSelectionModel.studentId, studentId),
            eq(studentSubjectSelectionModel.isActive, true),
            // Only get the latest version for each subject category
            sql`${studentSubjectSelectionModel.id} IN (
              SELECT DISTINCT ON (${studentSubjectSelectionModel.subjectSelectionMetaId}) 
                ${studentSubjectSelectionModel.id}
              FROM ${studentSubjectSelectionModel}
              WHERE ${studentSubjectSelectionModel.studentId} = ${studentId}
                AND ${studentSubjectSelectionModel.isActive} = true
              ORDER BY ${studentSubjectSelectionModel.subjectSelectionMetaId}, 
                       ${studentSubjectSelectionModel.version} DESC, 
                       ${studentSubjectSelectionModel.createdAt} DESC
            )`,
          ),
        ),
    ]);

    const hasFormSubmissions = actualStudentSelections.length > 0;

    // Debug: Log the actual student selections to see what subjects are being fetched
    console.log(
      `[SUBJECT-SELECTION] Student ${studentId} - actualStudentSelections (latest versions only):`,
      actualStudentSelections.map((selection) => ({
        id: selection.id,
        subjectName: selection.subjectName || "N/A",
        subjectCode: selection.subjectCode || "N/A",
        label: selection.metaLabel || "N/A",
        subjectTypeName: selection.subjectTypeName || "N/A",
        subjectTypeCode: selection.subjectTypeCode || "N/A",
        version: selection.version,
        createdAt: selection.createdAt,
      })),
    );

    // Debug: Check if this is a BCOM student
    const studentProgramCourse = await db
      .select({
        programCourseName: programCourseModel.name,
      })
      .from(promotionModel)
      .innerJoin(
        programCourseModel,
        eq(promotionModel.programCourseId, programCourseModel.id),
      )
      .where(eq(promotionModel.studentId, studentId))
      .orderBy(desc(promotionModel.createdAt))
      .limit(1);

    console.log(
      `[SUBJECT-SELECTION] Student ${studentId} - programCourse:`,
      studentProgramCourse[0]?.programCourseName,
    );

    // console.log("studentSubjectsSelection:", studentSubjectsSelection);
    return {
      studentSubjectsSelection,
      selectedMinorSubjects: formatedSelectedMinorSubjects, // Keep original logic for form display
      subjectSelectionMetas, // Include meta data for dynamic labels
      hasFormSubmissions, // New field to indicate if student has submitted through the form
      actualStudentSelections: hasFormSubmissions
        ? actualStudentSelections
        : [], // Include actual form submissions if they exist
      session: foundSession, // Include session information for form submission
    };
  } catch (error) {
    console.error(
      "[subject-selection] Error in findSubjectsSelections:",
      error,
    );
    return {
      studentSubjectsSelection: [],
      selectedMinorSubjects: [],
      subjectSelectionMetas: [],
      hasFormSubmissions: false,
      actualStudentSelections: [],
      session: null,
    };
  }
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
    .where(and(eq(admissionAcademicInfoModel.studentId, foundStudent?.id!)));

  const [foundAdmission] = await db
    .select()
    .from(admissionModel)
    .where(eq(admissionModel.id, foundApplicationForm?.admissionId!));

  const [foundSession] = await db
    .select()
    .from(sessionModel)
    .where(eq(sessionModel.id, foundAdmission?.sessionId!));

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
    foundAdmCourseDetail,
  };
}

// Helper function to fetch subject selection meta data
async function fetchSubjectSelectionMetaData(
  academicYearId: number,
  subjectTypeIds: number[],
  streamIds: number[],
): Promise<SubjectSelectionMetaDto[]> {
  console.log(subjectTypeIds, streamIds);

  // Fetch subject selection metas for the given academic year and subject types
  const subjectSelectionMetas = await db
    .select({
      id: subjectSelectionMetaModel.id,
      label: subjectSelectionMetaModel.label,
      subjectTypeId: subjectSelectionMetaModel.subjectTypeId,
      academicYearId: subjectSelectionMetaModel.academicYearId,
      createdAt: subjectSelectionMetaModel.createdAt,
      updatedAt: subjectSelectionMetaModel.updatedAt,
    })
    .from(subjectSelectionMetaModel)
    .where(eq(subjectSelectionMetaModel.academicYearId, academicYearId));
  //   console.log("subjectSelectionMetas:", subjectSelectionMetas);

  // Convert to full DTOs with related data
  const fullDtos = await Promise.all(
    subjectSelectionMetas.map(async (meta) => {
      // Fetch related data for each meta
      const [academicYear, subjectType, streams, forClasses] =
        await Promise.all([
          db
            .select()
            .from(academicYearModel)
            .where(eq(academicYearModel.id, meta.academicYearId)),
          db
            .select()
            .from(subjectTypeModel)
            .where(eq(subjectTypeModel.id, meta.subjectTypeId)),
          // Fetch streams through the many-to-many relationship
          db
            .select({
              id: subjectSelectionMetaStreamModel.id,
              createdAt: subjectSelectionMetaStreamModel.createdAt,
              updatedAt: subjectSelectionMetaStreamModel.updatedAt,
              stream: {
                id: streamModel.id,
                name: streamModel.name,
                code: streamModel.code,
                shortName: streamModel.shortName,
                isActive: streamModel.isActive,
                createdAt: streamModel.createdAt,
                updatedAt: streamModel.updatedAt,
              },
            })
            .from(subjectSelectionMetaStreamModel)
            .leftJoin(
              streamModel,
              eq(subjectSelectionMetaStreamModel.streamId, streamModel.id),
            )
            .where(
              eq(
                subjectSelectionMetaStreamModel.subjectSelectionMetaId,
                meta.id,
              ),
            ),
          // Fetch classes through the many-to-many relationship
          db
            .select({
              id: subjectSelectionMetaClassModel.id,
              subjectSelectionMetaId:
                subjectSelectionMetaClassModel.subjectSelectionMetaId,
              createdAt: subjectSelectionMetaClassModel.createdAt,
              updatedAt: subjectSelectionMetaClassModel.updatedAt,
              class: {
                id: classModel.id,
                name: classModel.name,
                type: classModel.type,
                isActive: classModel.isActive,
                createdAt: classModel.createdAt,
                updatedAt: classModel.updatedAt,
              },
            })
            .from(subjectSelectionMetaClassModel)
            .leftJoin(
              classModel,
              eq(subjectSelectionMetaClassModel.classId, classModel.id),
            )
            .where(
              eq(
                subjectSelectionMetaClassModel.subjectSelectionMetaId,
                meta.id,
              ),
            ),
        ]);

      return {
        id: meta.id!,
        academicYear: academicYear[0]!,
        subjectType: subjectType[0]!,
        streams: streams.map((s) => ({
          id: s.id!,
          createdAt: s.createdAt || new Date(),
          updatedAt: s.updatedAt || new Date(),
          stream: s.stream!,
        })),
        forClasses: forClasses.map((c) => ({
          id: c.id!,
          subjectSelectionMetaId: c.subjectSelectionMetaId!,
          createdAt: c.createdAt || new Date(),
          updatedAt: c.updatedAt || new Date(),
          class: c.class!,
        })),
        label: meta.label,
        createdAt: meta.createdAt || new Date(),
        updatedAt: meta.updatedAt || new Date(),
      } as unknown as SubjectSelectionMetaDto;
    }),
  );

  // Filter metas by subject types and streams. If a meta has no streams configured,
  // treat it as applicable to all streams. If caller passes empty streamIds, match all.
  return fullDtos.filter((meta) => {
    const streamMatch =
      streamIds.length === 0 ||
      meta.streams.length === 0 ||
      meta.streams.some((s) => s.stream?.id && streamIds.includes(s.stream.id));
    const subjectTypeId = meta.subjectType?.id as number | undefined;
    const subjectTypeMatch =
      typeof subjectTypeId === "number" &&
      subjectTypeIds.includes(subjectTypeId);
    const academicYearMatch = meta.academicYear?.id === academicYearId;
    return streamMatch && subjectTypeMatch && academicYearMatch;
  });
}

export async function findMandatoryPapers(studentId: number) {
  try {
    const { foundProgramCourse, foundClass, foundSession } =
      await findPromotionByStudentId(studentId);

    const [foundAcademicYear] = await db
      .select()
      .from(academicYearModel)
      .where(eq(academicYearModel.id, foundSession?.academicYearId!));

    // Resolve keys used for lookups
    const resolvedAcademicYearId =
      foundSession?.academicYearId || foundAcademicYear?.id;
    const resolvedProgramCourseId = foundProgramCourse?.id;

    if (!resolvedAcademicYearId || !resolvedProgramCourseId) {
      return [];
    }

    // Fetch mandatory papers (non-optional, active papers for the student's academic year and program course)
    const mandatoryPapers = await db
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
          eq(paperModel.academicYearId, resolvedAcademicYearId as number),
          eq(paperModel.programCourseId, resolvedProgramCourseId),
          eq(paperModel.isActive, true),
          eq(paperModel.isOptional, false), // Only non-optional (mandatory) papers
        ),
      );

    return mandatoryPapers;
  } catch (error) {
    console.error("[findMandatoryPapers] Error:", error);
    return [];
  }
}
