import { db } from "@/db";
import { and, asc, desc, eq, sql, max, inArray, or, isNull } from "drizzle-orm";
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
  subjectGroupingMainModel,
  subjectGroupingSubjectModel,
  subjectGroupingProgramCourseModel,
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
  subjectSelectionMetaSourceModel,
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

  // const foundPromotionStatus = await db
  //   .select()
  //   .from(promotionStatusModel)
  //   .where(eq(promotionStatusModel.id, foundPromotion?.promotionStatusId!));

  return {
    foundPromotion,
    foundProgramCourse,
    foundSession,
    foundAcademicYear,
    foundSection,
    foundClass,
    foundShift,
    // foundPromotionStatus,
  };
}

/**
 * The academic year a student belongs to, resolved as latest promotion → session
 * → academicYear (the SAME resolution the subject-selection options use). Exposed
 * so dependent student-scoped configs (e.g. restricted groupings) stay on exactly
 * the same year as the student's papers/metas. Returns null if not resolvable.
 */
export async function getStudentAcademicYearId(
  studentId: number,
): Promise<number | null> {
  const { foundSession } = await findPromotionByStudentId(studentId);
  return foundSession?.academicYearId ?? null;
}

/**
 * The AY the student was FIRST admitted under — first promotion's session's
 * academic year. Every subject_selection_meta binds to the student via THIS
 * AY, not the current semester's AY: a student registered in 2023-24 who is
 * now in Sem VI (session 2025-26) still fills Sem VI selections against the
 * 2023-24 meta ("Minor 4 (Semester VI)" for AY 2023-24). Otherwise the same
 * student would collect selections spread across 2023-24, 2024-25 and 2025-26
 * metas, breaking PRIOR_SELECTION source lookups and reports. Returns null
 * if the student has no promotions yet.
 */
export async function getRegistrationAcademicYearId(
  studentId: number,
): Promise<number | null> {
  const [firstPromo] = await db
    .select({ academicYearId: sessionModel.academicYearId })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .where(eq(promotionModel.studentId, studentId))
    .orderBy(asc(promotionModel.id))
    .limit(1);
  return firstPromo?.academicYearId ?? null;
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
        perMetaOptions: [] as PerMetaOptions[],
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

    // Precompute detailed DTOs for EVERY paper this request will need, in one
    // batched pass, instead of the previous per-paper modelToDetailedDto (9
    // sequential queries each) fired from inside the nested loops below. Covers
    // both the optional papers from subjectTypesWithPapers and the papers behind
    // the student's selected minor subjects. Output per paper is identical to
    // calling modelToDetailedDto individually.
    const minorPaperIds = Array.from(
      new Set(studentSelectedMinorSubjects.map((s) => s.paperId)),
    );
    const minorPapers = minorPaperIds.length
      ? await db
          .select()
          .from(paperModel)
          .where(inArray(paperModel.id, minorPaperIds as number[]))
      : [];
    const optionalPapers = subjectTypesWithPapers
      .map((row) => row.paper)
      .filter((p): p is NonNullable<typeof p> => !!p);
    const detailedByPaperId = await paperService.modelToDetailedDtoBatch([
      ...optionalPapers,
      ...minorPapers,
    ]);

    // Build the selected-minor detailed list from the batch map (paper order
    // preserved via the selections list), matching the prior filter of nulls.
    const minorPaperById = new Map(minorPapers.map((p) => [p.id, p]));
    const selectedMinorDetailedList = studentSelectedMinorSubjects.map(
      (selection) => {
        const paper = minorPaperById.get(selection.paperId);
        return paper ? (detailedByPaperId.get(paper.id!) ?? null) : null;
      },
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
                const detailed = detailedByPaperId.get(paper.id!) ?? null;
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
                const detailed = detailedByPaperId.get(paper.id!) ?? null;
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
          const detailed = detailedByPaperId.get(paper.id!) ?? null;
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

    // Fetch subject selection meta data.
    // Metas are keyed by the student's REGISTRATION year (first promotion's
    // session's AY), not the current-semester AY. Everything else on this
    // page (papers, program-course, class) stays on the current-semester AY
    // because those are the papers the student is actually being offered now.
    // Falls back to the current AY when a student somehow has no promotions.
    const registrationAyId =
      (await getRegistrationAcademicYearId(studentId)) ?? foundAcademicYear.id;
    // Pre-query metas the student already has active selections under. Passed
    // to fetchSubjectSelectionMetaData so those metas are shown even when their
    // stream config doesn't match — otherwise misfiled legacy picks (Commerce
    // student with picks under Arts-only meta 29, from the CU admit-card
    // loader) are invisible in the admin form and can't be corrected.
    const existingSelectionMetaIdsRows = await db
      .selectDistinct({
        metaId: studentSubjectSelectionModel.subjectSelectionMetaId,
      })
      .from(studentSubjectSelectionModel)
      .where(
        and(
          eq(studentSubjectSelectionModel.studentId, studentId),
          eq(studentSubjectSelectionModel.isActive, true),
        ),
      );
    const existingSelectionMetaIds = existingSelectionMetaIdsRows
      .map((r) => r.metaId)
      .filter((id): id is number => typeof id === "number");
    const subjectSelectionMetas = await fetchSubjectSelectionMetaData(
      registrationAyId,
      subjectTypeIds,
      streamIds,
      existingSelectionMetaIds,
    );

    // Options resolved PER META, so the form can render one dropdown per meta
    // instead of hardcoding which category+semester feeds which slot.
    const perMetaOptions = await buildPerMetaOptions(
      studentId,
      subjectSelectionMetas,
      studentSubjectsSelection,
      foundProgramCourse?.id,
      registrationAyId,
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
          // Subject-group fields (SUBJECT_GROUP metas store the pick under
          // subject_grouping_main_id_fk with subject_id_fk = null; without
          // these fields the rehydrate on the client can't restore the
          // dropdown for group picks).
          subjectGroupingMainId:
            studentSubjectSelectionModel.subjectGroupingMainId,
          subjectGroupingMainName: subjectGroupingMainModel.name,
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
          subjectGroupingMainModel,
          eq(
            studentSubjectSelectionModel.subjectGroupingMainId,
            subjectGroupingMainModel.id,
          ),
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
            // Latest version per (meta, subject). A single meta can hold >1
            // subject pick (e.g. "Minor 2 (Sem III & IV)" carries a Sem III
            // subject AND a Sem IV subject) — DISTINCT ON meta alone would
            // drop one of them via the tie-breaker. Adding subject_id_fk to
            // the DISTINCT ON preserves both while still keeping only the
            // latest version of each (meta, subject) tuple.
            sql`${studentSubjectSelectionModel.id} IN (
              SELECT DISTINCT ON (
                       ${studentSubjectSelectionModel.subjectSelectionMetaId},
                       ${studentSubjectSelectionModel.subjectId}
                     )
                ${studentSubjectSelectionModel.id}
              FROM ${studentSubjectSelectionModel}
              WHERE ${studentSubjectSelectionModel.studentId} = ${studentId}
                AND ${studentSubjectSelectionModel.isActive} = true
              ORDER BY ${studentSubjectSelectionModel.subjectSelectionMetaId},
                       ${studentSubjectSelectionModel.subjectId},
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
      perMetaOptions, // Options resolved per meta (meta-driven dropdowns)
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
      perMetaOptions: [] as PerMetaOptions[],
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
/** One meta's resolved option list, ready for a single dropdown. */
export interface PerMetaOptions {
  metaId: number;
  metaLabel: string;
  optionSource: "ELECTIVE_SUBJECTS" | "PRIOR_SELECTION" | "SUBJECT_GROUP";
  /**
   * The meta's subject-type code (MN / IDC / AEC / CVAC). The forms key their
   * restricted-grouping rules off this, so it has to travel with the options.
   */
  subjectTypeCode: string | null;
  subjectTypeName: string | null;
  /** Drives dropdown ordering, replacing the hardcoded JSX order. */
  sequence: number | null;
  /** Class ids this meta applies to (its semesters). */
  classIds: number[];
  /**
   * Class names for those ids. The restricted-grouping semester context is
   * still expressed in roman numerals parsed from these names, so the forms
   * can derive it exactly as they do today.
   */
  classNames: string[];
  /** PRIOR_SELECTION only: the metas this one draws its options from. */
  sourceMetaIds: number[];
  options: {
    /**
     * The subject picked. Null for SUBJECT_GROUP options — those key on
     * `subjectGroupingMainId` instead. Exactly one of subjectId /
     * subjectGroupingMainId is set per option.
     */
    subjectId: number | null;
    subjectName: string;
    subjectCode: string | null;
    /**
     * SUBJECT_GROUP only: the group picked. Storage keys on this rather than
     * subjectId — see student_subject_selections.subject_grouping_main_id_fk.
     */
    subjectGroupingMainId: number | null;
    /** Present for ELECTIVE_SUBJECTS (the paper's semester); null otherwise. */
    classId: number | null;
    className: string | null;
    /** Present for ELECTIVE_SUBJECTS so callers can still reach the paper. */
    paperId: number | null;
    /**
     * Mirrors `paper.auto_assign`. The forms pre-select auto-assigned papers,
     * so dropping it here would silently disable that behaviour.
     */
    autoAssign: boolean;
  }[];
}

/**
 * Resolves each meta's selectable options.
 *
 * ELECTIVE_SUBJECTS (default, unchanged behaviour): the meta's options are the
 * already-eligibility-filtered `paperOptions` of its subject type, narrowed to
 * the meta's own semesters. We deliberately read from `studentSubjectsSelection`
 * rather than re-querying, so the 12th-board / related-subject filtering that
 * produced it is reused verbatim — the option SET for a meta is exactly what the
 * form shows today for that category+semester, just resolved server-side.
 *
 * PRIOR_SELECTION: the meta's options are the subjects this student already
 * selected under the configured source metas (e.g. Minor 5 offers only what the
 * student picked in Minor 1 / Minor 2). No eligibility re-filtering — those
 * subjects were already validated when they were chosen.
 *
 * SUBJECT_GROUP: the meta's options are the subject groups
 * (subject_grouping_main) whose subjectType matches the meta's subjectTypeId
 * AND that contain at least one elective (isOptional=true) paper for the
 * student's programCourse + registration AY in the meta's classes. The whole
 * group is the terminal selection — each option carries `subjectGroupingMainId`
 * (subjectId is null). No 12th-board / restricted-grouping paper-level
 * eligibility is applied; the "has an elective paper" filter is the whole gate.
 */
async function buildPerMetaOptions(
  studentId: number,
  metas: SubjectSelectionMetaDto[],
  studentSubjectsSelection: { subjectType: any; paperOptions: any[] }[],
  programCourseId: number | null | undefined,
  registrationAyId: number | null | undefined,
): Promise<PerMetaOptions[]> {
  // Prior selections are only needed if some meta actually asks for them.
  const priorMetas = metas.filter(
    (m) => (m as any).optionSource === "PRIOR_SELECTION",
  );
  const allSourceIds = [
    ...new Set(
      priorMetas.flatMap((m) => ((m as any).sourceMetaIds ?? []) as number[]),
    ),
  ];

  // studentId -> the subjects they actively hold under each source meta.
  const subjectsBySourceMeta = new Map<
    number,
    { subjectId: number; subjectName: string; subjectCode: string | null }[]
  >();
  if (allSourceIds.length > 0) {
    const rows = await db
      .select({
        metaId: studentSubjectSelectionModel.subjectSelectionMetaId,
        subjectId: subjectModel.id,
        subjectName: subjectModel.name,
        subjectCode: subjectModel.code,
      })
      .from(studentSubjectSelectionModel)
      .innerJoin(
        subjectModel,
        eq(studentSubjectSelectionModel.subjectId, subjectModel.id),
      )
      .where(
        and(
          eq(studentSubjectSelectionModel.studentId, studentId),
          inArray(
            studentSubjectSelectionModel.subjectSelectionMetaId,
            allSourceIds,
          ),
          eq(studentSubjectSelectionModel.isActive, true),
          or(
            isNull(studentSubjectSelectionModel.isDeprecated),
            eq(studentSubjectSelectionModel.isDeprecated, false),
          ),
          // A student can hold more than one active row per meta (revisions),
          // so take only the latest version — otherwise a superseded subject
          // would be offered alongside the current one. Mirrors the
          // latest-version filter used for actualStudentSelections above.
          // DISTINCT ON must include subject_id: a source meta like "Minor 1
          // (Semester I & II)" legitimately holds TWO subjects (one per
          // semester), and keying on the meta alone collapsed it to one, so the
          // continuation dropdown silently lost half its options. Mirrors the
          // same fix already applied to actualStudentSelections above.
          sql`${studentSubjectSelectionModel.id} IN (
            SELECT DISTINCT ON (
                     ${studentSubjectSelectionModel.subjectSelectionMetaId},
                     ${studentSubjectSelectionModel.subjectId}
                   )
              ${studentSubjectSelectionModel.id}
            FROM ${studentSubjectSelectionModel}
            WHERE ${studentSubjectSelectionModel.studentId} = ${studentId}
              AND ${studentSubjectSelectionModel.isActive} = true
            ORDER BY ${studentSubjectSelectionModel.subjectSelectionMetaId},
                     ${studentSubjectSelectionModel.subjectId},
                     ${studentSubjectSelectionModel.version} DESC,
                     ${studentSubjectSelectionModel.createdAt} DESC
          )`,
        ),
      );
    for (const r of rows) {
      const list = subjectsBySourceMeta.get(r.metaId) ?? [];
      list.push({
        subjectId: r.subjectId,
        subjectName: r.subjectName,
        subjectCode: r.subjectCode,
      });
      subjectsBySourceMeta.set(r.metaId, list);
    }
  }

  // SUBJECT_GROUP prefetch — one query per (subjectTypeId, classIds) key,
  // batched. Groups must be linked to the student's program course AND have
  // at least one elective paper matching the meta's semesters. Returns groups
  // deduplicated per key so a single meta can render N groups without extra
  // per-meta round-trips.
  const groupMetas = metas.filter(
    (m) => (m as any).optionSource === "SUBJECT_GROUP",
  );
  type GroupOption = {
    subjectGroupingMainId: number;
    subjectGroupingMainName: string;
    subjectGroupingMainCode: string | null;
  };
  const groupsByKey = new Map<string, GroupOption[]>();
  const makeGroupKey = (subjectTypeId: number | null, classIds: number[]) =>
    `${subjectTypeId ?? 0}|${[...classIds].sort((a, b) => a - b).join(",")}`;
  if (groupMetas.length > 0 && programCourseId && registrationAyId) {
    // Deduplicate keys first, then fire the SELECTs in parallel — sequential
    // awaits per meta added visible latency to form loads with many metas.
    const keysToFetch = new Map<
      string,
      { subjectTypeId: number; classIds: number[] }
    >();
    for (const meta of groupMetas) {
      const metaSubjectTypeId = (meta.subjectType as any)?.id ?? null;
      const metaClassIds = (meta.forClasses ?? [])
        .map((c) => c?.class?.id)
        .filter((v): v is number => typeof v === "number");
      if (!metaSubjectTypeId || metaClassIds.length === 0) continue;
      const key = makeGroupKey(metaSubjectTypeId, metaClassIds);
      if (keysToFetch.has(key)) continue;
      keysToFetch.set(key, {
        subjectTypeId: metaSubjectTypeId,
        classIds: metaClassIds,
      });
    }
    await Promise.all(
      Array.from(keysToFetch.entries()).map(async ([key, filter]) => {
        const rows = await db
          .selectDistinct({
            id: subjectGroupingMainModel.id,
            name: subjectGroupingMainModel.name,
            code: subjectGroupingMainModel.code,
          })
          .from(subjectGroupingMainModel)
          .innerJoin(
            subjectGroupingProgramCourseModel,
            eq(
              subjectGroupingProgramCourseModel.subjectGroupingMainId,
              subjectGroupingMainModel.id,
            ),
          )
          .innerJoin(
            subjectGroupingSubjectModel,
            eq(
              subjectGroupingSubjectModel.subjectGroupingMainId,
              subjectGroupingMainModel.id,
            ),
          )
          .innerJoin(
            paperModel,
            eq(paperModel.subjectId, subjectGroupingSubjectModel.subjectId),
          )
          .where(
            and(
              eq(subjectGroupingMainModel.isActive, true),
              eq(subjectGroupingMainModel.subjectTypeId, filter.subjectTypeId),
              eq(
                subjectGroupingProgramCourseModel.programCourseId,
                programCourseId,
              ),
              eq(paperModel.isOptional, true),
              eq(paperModel.programCourseId, programCourseId),
              eq(paperModel.academicYearId, registrationAyId),
              eq(paperModel.subjectTypeId, filter.subjectTypeId),
              inArray(paperModel.classId, filter.classIds),
            ),
          )
          .orderBy(asc(subjectGroupingMainModel.name));
        groupsByKey.set(
          key,
          rows.map((r) => ({
            subjectGroupingMainId: r.id,
            subjectGroupingMainName: r.name,
            subjectGroupingMainCode: r.code,
          })),
        );
      }),
    );
  }

  return metas.map((meta): PerMetaOptions => {
    const optionSource =
      ((meta as any).optionSource as PerMetaOptions["optionSource"]) ??
      "ELECTIVE_SUBJECTS";
    const classIds = (meta.forClasses ?? [])
      .map((c) => c?.class?.id)
      .filter((v): v is number => typeof v === "number");
    const classNames = (meta.forClasses ?? [])
      .map((c) => c?.class?.name)
      .filter((v): v is string => typeof v === "string");
    const metaCommon = {
      metaId: meta.id!,
      metaLabel: meta.label,
      optionSource,
      subjectTypeCode: (meta.subjectType as any)?.code ?? null,
      subjectTypeName: (meta.subjectType as any)?.name ?? null,
      sequence: meta.sequence ?? null,
      classIds,
      classNames,
      // Sent so the client can recompute a PRIOR_SELECTION list live as the
      // source dropdowns change, instead of waiting for a save + refetch.
      sourceMetaIds: (((meta as any).sourceMetaIds ?? []) as number[]) || [],
    };

    if (optionSource === "PRIOR_SELECTION") {
      const sourceIds = (((meta as any).sourceMetaIds ?? []) as number[]) || [];
      const seen = new Set<number>();
      const options: PerMetaOptions["options"] = [];
      for (const sourceId of sourceIds) {
        for (const s of subjectsBySourceMeta.get(sourceId) ?? []) {
          if (seen.has(s.subjectId)) continue; // same subject via two sources
          seen.add(s.subjectId);
          options.push({
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            subjectCode: s.subjectCode,
            subjectGroupingMainId: null,
            classId: null,
            className: null,
            paperId: null,
            // Prior selections are explicit student picks, never auto-assigned.
            autoAssign: false,
          });
        }
      }
      return { ...metaCommon, options };
    }

    if (optionSource === "SUBJECT_GROUP") {
      const metaSubjectTypeId = (meta.subjectType as any)?.id ?? null;
      const key = makeGroupKey(metaSubjectTypeId, classIds);
      const options: PerMetaOptions["options"] = (
        groupsByKey.get(key) ?? []
      ).map((g) => ({
        subjectId: null,
        subjectName: g.subjectGroupingMainName,
        subjectCode: g.subjectGroupingMainCode,
        subjectGroupingMainId: g.subjectGroupingMainId,
        classId: null,
        className: null,
        paperId: null,
        // Group picks are always explicit student choices, never auto-assigned.
        autoAssign: false,
      }));
      return { ...metaCommon, options };
    }

    // ELECTIVE_SUBJECTS — reuse the already-filtered options for this subject
    // type, narrowed to the meta's semesters.
    const group = studentSubjectsSelection.find(
      (g) => g.subjectType?.id === (meta.subjectType as any)?.id,
    );
    const seen = new Set<string>();
    const options: PerMetaOptions["options"] = [];
    for (const p of group?.paperOptions ?? []) {
      const classId = p?.class?.id ?? null;
      // No classes configured on the meta => it applies to all semesters.
      if (
        classIds.length > 0 &&
        (classId == null || !classIds.includes(classId))
      )
        continue;
      const key = `${p?.subject?.id}|${classId}`;
      if (seen.has(key)) continue; // the same subject can have >1 paper
      seen.add(key);
      options.push({
        subjectId: p?.subject?.id,
        subjectName: p?.subject?.name,
        subjectCode: p?.subject?.code ?? null,
        subjectGroupingMainId: null,
        classId,
        className: p?.class?.name ?? null,
        paperId: p?.id ?? null,
        autoAssign: (p as any)?.autoAssign === true,
      });
    }
    return { ...metaCommon, options };
  });
}

async function fetchSubjectSelectionMetaData(
  academicYearId: number,
  subjectTypeIds: number[],
  streamIds: number[],
  // Metas the student ALREADY has active selections under. These are shown even
  // if their stream config doesn't match the student's stream — so misfiled
  // legacy data (e.g. a Commerce student with picks under an Arts/Mgmt/Sci
  // meta because the CU admit-card loader wrote to the wrong meta) stays
  // visible in the admin form and can be corrected. Without this the picks are
  // silently hidden and the admin has no way to see or fix them.
  includeMetaIds: number[] = [],
): Promise<SubjectSelectionMetaDto[]> {
  console.log(subjectTypeIds, streamIds);

  // Fetch subject selection metas for the given academic year and subject types
  const subjectSelectionMetas = await db
    .select({
      id: subjectSelectionMetaModel.id,
      label: subjectSelectionMetaModel.label,
      // Drives dropdown ordering in the forms. Without it every meta reports
      // sequence 0 and the dropdowns fall back to meta-id order.
      sequence: subjectSelectionMetaModel.sequence,
      subjectTypeId: subjectSelectionMetaModel.subjectTypeId,
      academicYearId: subjectSelectionMetaModel.academicYearId,
      optionSource: subjectSelectionMetaModel.optionSource,
      createdAt: subjectSelectionMetaModel.createdAt,
      updatedAt: subjectSelectionMetaModel.updatedAt,
    })
    .from(subjectSelectionMetaModel)
    .where(
      and(
        eq(subjectSelectionMetaModel.academicYearId, academicYearId),
        // Active = isActive true OR null (default). Hide inactive metas from students.
        or(
          isNull(subjectSelectionMetaModel.isActive),
          eq(subjectSelectionMetaModel.isActive, true),
        ),
      ),
    );
  //   console.log("subjectSelectionMetas:", subjectSelectionMetas);

  // Convert to full DTOs with related data
  const fullDtos = await Promise.all(
    subjectSelectionMetas.map(async (meta) => {
      // Fetch related data for each meta
      const [academicYear, subjectType, streams, forClasses, sourceRows] =
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
          // The metas this one draws its options from (PRIOR_SELECTION only).
          db
            .select({
              sourceMetaId:
                subjectSelectionMetaSourceModel.sourceSubjectSelectionMetaId,
            })
            .from(subjectSelectionMetaSourceModel)
            .where(
              eq(
                subjectSelectionMetaSourceModel.subjectSelectionMetaId,
                meta.id,
              ),
            ),
        ]);

      return {
        id: meta.id!,
        sequence: meta.sequence,
        academicYear: academicYear[0]!,
        subjectType: subjectType[0]!,
        optionSource: meta.optionSource,
        sourceMetaIds: sourceRows.map((r) => r.sourceMetaId),
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
  // A meta whose id is in includeMetaIds bypasses the stream/subjectType checks
  // (still AY-scoped) so misfiled legacy selections remain visible for correction.
  const includeSet = new Set(includeMetaIds);
  return fullDtos.filter((meta) => {
    const academicYearMatch = meta.academicYear?.id === academicYearId;
    if (!academicYearMatch) return false;
    if (includeSet.has(meta.id as number)) return true;
    const streamMatch =
      streamIds.length === 0 ||
      meta.streams.length === 0 ||
      meta.streams.some((s) => s.stream?.id && streamIds.includes(s.stream.id));
    const subjectTypeId = meta.subjectType?.id as number | undefined;
    const subjectTypeMatch =
      typeof subjectTypeId === "number" &&
      subjectTypeIds.includes(subjectTypeId);
    return streamMatch && subjectTypeMatch;
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
