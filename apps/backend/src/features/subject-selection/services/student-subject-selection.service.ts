import { db } from "@/db/index.js";
import { and, countDistinct, desc, eq, inArray, max, sql } from "drizzle-orm";
import { studentSubjectSelectionModel } from "@repo/db/schemas/models/subject-selection/student-subject-selection.model";
import { sessionModel } from "@repo/db/schemas/models/academics";
import {
  subjectSelectionMetaModel,
  subjectSelectionMetaStreamModel,
  subjectSelectionMetaClassModel,
} from "@repo/db/schemas/models/subject-selection";
import {
  subjectModel,
  streamModel,
  subjectTypeModel,
  programCourseModel,
} from "@repo/db/schemas/models/course-design";
import { academicYearModel } from "@repo/db/schemas/models/academics";
import { classModel } from "@repo/db/schemas/models/academics/class.model";
import { userModel } from "@repo/db/schemas/models/user";
import { studentModel } from "@repo/db/schemas/models/user/student.model";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model";
import { sectionModel } from "@repo/db/schemas/models/academics/section.model";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model";
import {
  StudentSubjectSelection,
  StudentSubjectSelectionT,
} from "@repo/db/schemas/models/subject-selection/student-subject-selection.model";
import {
  SubjectSelectionMetaDto,
  StudentSubjectSelectionDto,
} from "@repo/db/dtos/subject-selection/index";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import * as studentSubjectsService from "./student-subjects.service";
import * as XLSX from "xlsx";
import { socketService } from "@/services/socketService.js";
import { enqueueNotification } from "@/services/notificationClient.js";
import {
  getNotificationMasterIdByName,
  getNotificationMasterIdByNameAndVariant,
} from "@/services/notificationMastersCache.js";

export type CreateStudentSubjectSelectionDtoInput = {
  studentId: number;
  session: { id: number };
  subjectSelectionMeta: { id: number };
  subject: { id: number };
  // Versioning fields
  createdBy?: number; // User ID who created this (student/admin)
  changeReason?: string; // Reason for creation/change
};

// Input format from frontend (simplified)
export type StudentSubjectSelectionInput = {
  studentId: number;
  session: { id: number };
  subjectSelectionMeta: { id: number };
  subject: { id: number; name: string };
};

export type UpdateStudentSubjectSelectionDtoInput =
  Partial<CreateStudentSubjectSelectionDtoInput>;

// Validation types
export interface SubjectSelectionValidationError {
  field: string;
  message: string;
}

export interface SubjectSelectionData {
  minor1?: string;
  minor2?: string;
  idc1?: string;
  idc2?: string;
  idc3?: string;
  aec3?: string;
  cvac4?: string;
}

export interface AvailableSubjects {
  admissionMinor1Subjects: string[];
  admissionMinor2Subjects: string[];
  availableIdcSem1Subjects: string[];
  availableIdcSem2Subjects: string[];
  availableIdcSem3Subjects: string[];
  availableAecSubjects: string[];
  availableCvacOptions: string[];
  autoMinor1?: string;
  autoMinor2?: string;
  autoIdc1?: string;
  autoIdc2?: string;
  autoIdc3?: string;
}

// -- Helpers -----------------------------------------------------------------

// Helper function to normalize stream names for comparison
function normalizeStreamName(name: string): string {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ""); // Remove all special characters, spaces, dots, etc.
}

// Helper function to get student's stream information
async function getStudentStreamInfo(
  studentId: number,
): Promise<{ streamName: string; streamCode: string } | null> {
  try {
    console.log("[backend] Starting stream detection for student:", studentId);

    const [studentWithStream] = await db
      .select({
        streamName: streamModel.name,
        streamCode: streamModel.code,
        studentId: studentModel.id,
        programCourseId: studentModel.programCourseId,
      })
      .from(studentModel)
      .leftJoin(
        programCourseModel,
        eq(studentModel.programCourseId, programCourseModel.id),
      )
      .leftJoin(streamModel, eq(programCourseModel.streamId, streamModel.id))
      .where(eq(studentModel.id, studentId))
      .limit(1);

    console.log("[backend] Stream detection query result:", {
      studentId,
      studentWithStream,
      hasStreamName: !!studentWithStream?.streamName,
      streamName: studentWithStream?.streamName,
      streamCode: studentWithStream?.streamCode,
      normalizedStreamName: studentWithStream?.streamName
        ? normalizeStreamName(studentWithStream.streamName)
        : null,
    });

    if (studentWithStream?.streamName) {
      const normalizedStream = normalizeStreamName(
        studentWithStream.streamName,
      );
      console.log("[backend] Stream found via direct query:", {
        original: studentWithStream.streamName,
        normalized: normalizedStream,
        code: studentWithStream.streamCode,
      });

      return {
        streamName: studentWithStream.streamName,
        streamCode: studentWithStream.streamCode || "",
      };
    } else {
      console.log(
        "[backend] No stream found for student, checking program course directly",
      );

      // Fallback: try to get stream from program course name
      const [programCourse] = await db
        .select({
          name: programCourseModel.name,
          streamName: streamModel.name,
          streamCode: streamModel.code,
        })
        .from(programCourseModel)
        .leftJoin(streamModel, eq(programCourseModel.streamId, streamModel.id))
        .where(eq(programCourseModel.id, studentWithStream?.programCourseId))
        .limit(1);

      console.log("[backend] Program course fallback result:", {
        programCourse,
        normalizedProgramName: programCourse?.name
          ? normalizeStreamName(programCourse.name)
          : null,
      });

      // PRIORITY: Extract stream from program course name (more reliable)
      if (programCourse?.name) {
        const programName = programCourse.name;
        const normalizedProgramName = normalizeStreamName(programName);
        let detectedStream = "";

        console.log(
          "[backend] Attempting stream extraction from program name:",
          {
            original: programName,
            normalized: normalizedProgramName,
          },
        );

        // Check for BSC variations (B.Sc., BSC, Science, etc.)
        if (
          normalizedProgramName.includes("BSC") ||
          normalizedProgramName.includes("SCIENCE")
        ) {
          detectedStream = "BSC";
        }
        // Check for BCOM variations (B.Com., BCOM, Commerce, etc.)
        else if (
          normalizedProgramName.includes("BCOM") ||
          normalizedProgramName.includes("COMMERCE")
        ) {
          detectedStream = "BCOM";
        }
        // Check for BA variations (B.A., BA, Arts, etc.)
        else if (
          normalizedProgramName.includes("BA") ||
          normalizedProgramName.includes("ARTS")
        ) {
          detectedStream = "BA";
        }

        if (detectedStream) {
          console.log("[backend] Stream detected from program name:", {
            originalProgramName: programName,
            normalizedProgramName,
            detectedStream,
          });
          return {
            streamName: detectedStream,
            streamCode: detectedStream,
          };
        } else {
          console.log("[backend] No stream pattern matched in program name:", {
            originalProgramName: programName,
            normalizedProgramName,
            availablePatterns: [
              "BSC",
              "BCOM",
              "BA",
              "SCIENCE",
              "COMMERCE",
              "ARTS",
            ],
          });
        }
      }

      // Fallback: Use stream name from program course if program name extraction failed
      if (programCourse?.streamName) {
        const normalizedStream = normalizeStreamName(programCourse.streamName);
        console.log("[backend] Stream found via program course fallback:", {
          original: programCourse.streamName,
          normalized: normalizedStream,
          code: programCourse.streamCode,
        });

        return {
          streamName: programCourse.streamName,
          streamCode: programCourse.streamCode || "",
        };
      }
    }

    console.log(
      "[backend] No stream could be detected for student:",
      studentId,
    );
    return null;
  } catch (error) {
    console.error("Error fetching student stream info:", error);
    return null;
  }
}

// Helper function to get the correct notification master name based on stream
function getNotificationMasterNameByStream(
  streamName: string,
  variant: "EMAIL" | "WHATSAPP",
): string {
  const normalizedStream = normalizeStreamName(streamName);

  console.log("[backend] Notification master selection:", {
    originalStreamName: streamName,
    normalizedStream,
    variant,
  });

  if (variant === "EMAIL") {
    console.log(
      "[backend] Selected EMAIL notification master: Subject Selection Confirmation",
    );
    return "Subject Selection Confirmation";
  } else {
    // WhatsApp variant - stream-specific
    if (
      normalizedStream === "BSC" ||
      normalizedStream.includes("BSC") ||
      normalizedStream.includes("SCIENCE")
    ) {
      console.log("[backend] Selected BSC notification master for WhatsApp");
      return "Subject Selection Confirmation - BSC";
    } else if (
      normalizedStream === "BCOM" ||
      normalizedStream.includes("BCOM") ||
      normalizedStream.includes("COMMERCE")
    ) {
      console.log("[backend] Selected BCOM notification master for WhatsApp");
      return "Subject Selection Confirmation - BCOM";
    } else if (
      normalizedStream === "BA" ||
      normalizedStream.includes("BA") ||
      normalizedStream.includes("ARTS")
    ) {
      console.log("[backend] Selected BA notification master for WhatsApp");
      return "Subject Selection Confirmation - BA";
    } else {
      // Default fallback - but log this as it shouldn't happen
      console.log("[backend] WARNING: Using BA fallback for unknown stream:", {
        originalStreamName: streamName,
        normalizedStream,
        availablePatterns: ["BSC", "BCOM", "BA", "SCIENCE", "COMMERCE", "ARTS"],
      });
      return "Subject Selection Confirmation - BA";
    }
  }
}

async function modelToDto(
  row: StudentSubjectSelectionT,
): Promise<StudentSubjectSelectionDto> {
  // Fetch the joined entities for full DTO
  const [[session], [meta], [subject]] = await Promise.all([
    db
      .select()
      .from(sessionModel)
      .where(eq(sessionModel.id, row.sessionId as number)),
    db
      .select()
      .from(subjectSelectionMetaModel)
      .where(
        eq(subjectSelectionMetaModel.id, row.subjectSelectionMetaId as number),
      ),
    db
      .select()
      .from(subjectModel)
      .where(eq(subjectModel.id, row.subjectId as number)),
  ]);

  if (!session)
    throw new Error("Session not found for StudentSubjectSelection");
  if (!meta)
    throw new Error(
      "SubjectSelectionMeta not found for StudentSubjectSelection",
    );
  if (!subject)
    throw new Error("Subject not found for StudentSubjectSelection");

  // Fetch related data for SubjectSelectionMetaDto
  const [academicYear, subjectType, streams, forClasses] = await Promise.all([
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
        eq(subjectSelectionMetaStreamModel.subjectSelectionMetaId, meta.id),
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
        eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, meta.id),
      ),
  ]);

  const subjectSelectionMeta: SubjectSelectionMetaDto = {
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

  const dto: StudentSubjectSelectionDto = {
    id: row.id as number,
    studentId: row.studentId as number,
    session,
    subjectSelectionMeta,
    subject,
    version: row.version || 1,
    parentId: row.parentId || null,
    isDeprecated: row.isDeprecated || false,
    isActive: row.isActive || true,
    createdBy: row.createdBy || 0,
    changeReason: row.changeReason || null,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
  return dto;
}

// Helper: Build subject grid for email
function buildSubjectsByCategoryForEmail(
  rows: Array<{ metaLabel: string; subjectName: string }>,
): Record<string, Record<string, string>> {
  const grid: Record<string, Record<string, string>> = {};
  const put = (cat: string, sem: string, name: string) => {
    if (!grid[cat]) grid[cat] = {};
    if (!grid[cat][sem]) grid[cat][sem] = name;
  };
  for (const r of rows) {
    const label = String(r.metaLabel || "");
    const name = r.subjectName || "";
    if (!name) continue;
    const sem = /\b(I|II|III|IV)\b/.exec(label)?.[1] || "";
    if (/DSCC/i.test(label)) put("DSCC", sem, name);
    else if (/Minor/i.test(label)) put("Minor", sem, name);
    else if (/IDC/i.test(label)) put("IDC", sem, name);
    else if (/SEC/i.test(label)) put("SEC", sem, name);
    else if (/AEC/i.test(label)) put("AEC", sem, name);
    else if (/CVAC/i.test(label)) put("CVAC", sem, name);
  }
  return grid;
}

// async function enqueueSubjectSelectionEmail(
//     userId: number,
//     academicYearName: string,
//     subjectsByCategory: Record<string, Record<string, string>>,
// ) {
//     const { notificationModel } = await import("@repo/db/schemas/models/notifications/notification.model");
//     const { notificationContentModel } = await import("@repo/db/schemas/models/notifications/notification-content.model");
//     const { notificationQueueModel } = await import("@repo/db/schemas/models/notifications/notification-queue.model");
//     const { notificationMasterModel } = await import("@repo/db/schemas/models/notifications/notification-master.model");
//     const { notificationTypeEnum, notificationVariantEnum, notificationStatusEnum } = await import("@repo/db/schemas/enums");

//     // Global toggle via env
//     const enabled = String(process.env.NOTIFICATIONS_ENABLED || "true").toLowerCase() === "true";
//     if (!enabled) {
//         console.log("[Notif] Skipped: NOTIFICATIONS_ENABLED is false");
//         return;
//     }

//     // Respect master isActive flag
//     const MASTER_NAME = "STUDENT_SUBJECT_SELECTION_CONFIRMATION";
//     const [master] = await db
//         .select({ id: notificationMasterModel.id, isActive: notificationMasterModel.isActive })
//         .from(notificationMasterModel)
//         .where(eq(notificationMasterModel.name, MASTER_NAME))
//         .limit(1);
//     if (!master || master.isActive === false) {
//         console.log("[Notif] Skipped: master inactive or missing =>", MASTER_NAME);
//         return;
//     }

//     const notifInsert = await db
//         .insert(notificationModel)
//         .values({
//             userId,
//             notificationEventId: null,
//             variant: "INFO" as any,
//             type: "EMAIL" as any,
//             message: "Confirmation of Semester-wise Subject Selection",
//             status: "PENDING" as any,
//         })
//         .returning();
//     const notif = notifInsert[0];

//     const payload = {
//         subject: "Confirmation of Semester-wise Subject Selection under CCF",
//         emailTemplate: "student-subject-selection",
//         academicYear: academicYearName,
//         subjectsByCategory,
//     };

//     await db
//         .insert(notificationContentModel)
//         .values({
//             notificationId: notif.id as number,
//             notificationEventId: 0 as any,
//             emailTemplate: "student-subject-selection",
//             whatsappFieldId: 1 as any,
//             content: JSON.stringify(payload),
//         });

//     await db
//         .insert(notificationQueueModel)
//         .values({ notificationId: notif.id as number, type: "EMAIL_QUEUE" as any });
// }

// -- Validation Helpers -----------------------------------------------------------------

// Helper function to normalize subject names for comparison
function normalizeSubjectName(name: string): string {
  return String(name || "")
    .trim()
    .toUpperCase();
}

// Helper function to check if there are actual subject options
function hasActualOptions(subjects: string[]): boolean {
  return (
    subjects.filter((subject) => subject && subject.trim() !== "").length > 0
  );
}

// Helper function to extract semester from class name (similar to frontend logic)
function extractSemesterRoman(name?: string | null): string {
  if (!name) return "";
  const upper = String(name).toUpperCase();
  const romanMap: Record<string, string> = {
    "1": "I",
    "2": "II",
    "3": "III",
    "4": "IV",
    "5": "V",
    "6": "VI",
  };

  const romanMatch = upper.match(/\b(I|II|III|IV|V|VI)\b/);
  if (romanMatch) return romanMatch[1];

  const digitMatch = upper.match(/\b([1-6])\b/);
  if (digitMatch) return romanMap[digitMatch[1]] || "";

  return "";
}

// Helper function to check if subject is in specific semester
function isSemester(
  className: string | null | undefined,
  roman: string,
): boolean {
  return extractSemesterRoman(className) === roman;
}

// Helper function to categorize subjects by type
function categorizeSubject(
  subjectName: string,
  subjectTypeCode?: string | null,
): string {
  const name = normalizeSubjectName(subjectName);
  const code = normalizeSubjectName(subjectTypeCode || "");

  if (name.includes("MINOR") || code === "MN") return "MINOR";
  if (
    name.includes("INTERDISCIPLINARY") ||
    name.includes("INTER DISCIPLINARY") ||
    code === "IDC"
  )
    return "IDC";
  if (name.includes("ABILITY ENHANCEMENT") || code === "AEC") return "AEC";
  if (name.includes("COMMON VALUE ADDED") || code === "CVAC") return "CVAC";

  return "UNKNOWN";
}

// Get available subjects for a student
async function getAvailableSubjectsForStudent(
  studentId: number,
): Promise<AvailableSubjects> {
  const { studentSubjectsSelection } =
    await studentSubjectsService.findSubjectsSelections(studentId);

  const availableSubjects: AvailableSubjects = {
    admissionMinor1Subjects: [],
    admissionMinor2Subjects: [],
    availableIdcSem1Subjects: [],
    availableIdcSem2Subjects: [],
    availableIdcSem3Subjects: [],
    availableAecSubjects: [],
    availableCvacOptions: [],
  };

  // Process each subject type group
  for (const group of studentSubjectsSelection) {
    const subjectType = group.subjectType;
    const category = categorizeSubject(
      subjectType?.name || "",
      subjectType?.code,
    );

    // Get subject names from paper options
    const subjectNames = group.paperOptions
      .map((paper) => paper?.subject?.name || "")
      .filter((name) => name && name.trim() !== "");

    // Categorize by semester and type
    for (const paper of group.paperOptions) {
      const subjectName = paper?.subject?.name;
      if (!subjectName) continue;

      const semester = extractSemesterRoman(paper?.class?.name);
      const isAutoAssign = (paper as any)?.autoAssign === true;

      switch (category) {
        case "MINOR":
          if (semester === "I" || semester === "II") {
            availableSubjects.admissionMinor1Subjects.push(subjectName);
            if (isAutoAssign) availableSubjects.autoMinor1 = subjectName;
          } else if (semester === "III" || semester === "IV") {
            availableSubjects.admissionMinor2Subjects.push(subjectName);
            if (isAutoAssign) availableSubjects.autoMinor2 = subjectName;
          }
          break;
        case "IDC":
          if (semester === "I") {
            availableSubjects.availableIdcSem1Subjects.push(subjectName);
            if (isAutoAssign) availableSubjects.autoIdc1 = subjectName;
          } else if (semester === "II") {
            availableSubjects.availableIdcSem2Subjects.push(subjectName);
            if (isAutoAssign) availableSubjects.autoIdc2 = subjectName;
          } else if (semester === "III") {
            availableSubjects.availableIdcSem3Subjects.push(subjectName);
            if (isAutoAssign) availableSubjects.autoIdc3 = subjectName;
          }
          break;
        case "AEC":
          if (semester === "III") {
            availableSubjects.availableAecSubjects.push(subjectName);
          }
          break;
        case "CVAC":
          if (semester === "II") {
            availableSubjects.availableCvacOptions.push(subjectName);
          }
          break;
      }
    }
  }

  // Remove duplicates
  availableSubjects.admissionMinor1Subjects = [
    ...new Set(availableSubjects.admissionMinor1Subjects),
  ];
  availableSubjects.admissionMinor2Subjects = [
    ...new Set(availableSubjects.admissionMinor2Subjects),
  ];
  availableSubjects.availableIdcSem1Subjects = [
    ...new Set(availableSubjects.availableIdcSem1Subjects),
  ];
  availableSubjects.availableIdcSem2Subjects = [
    ...new Set(availableSubjects.availableIdcSem2Subjects),
  ];
  availableSubjects.availableIdcSem3Subjects = [
    ...new Set(availableSubjects.availableIdcSem3Subjects),
  ];
  availableSubjects.availableAecSubjects = [
    ...new Set(availableSubjects.availableAecSubjects),
  ];
  availableSubjects.availableCvacOptions = [
    ...new Set(availableSubjects.availableCvacOptions),
  ];

  return availableSubjects;
}

// Get restricted groupings for validation
async function getRestrictedGroupingsForStudent(
  studentId: number,
): Promise<any[]> {
  // For now, return empty array until we have the proper function
  // This will be implemented when we have access to the restricted grouping service
  return [];
}

// Validate subject selections from DTO array
export async function validateStudentSubjectSelections(
  studentId: number,
  selections: (StudentSubjectSelectionDto | StudentSubjectSelectionInput)[],
): Promise<SubjectSelectionValidationError[]> {
  const errors: SubjectSelectionValidationError[] = [];

  // Get available subjects and restricted groupings
  const [availableSubjects, restrictedGroupings] = await Promise.all([
    getAvailableSubjectsForStudent(studentId),
    getRestrictedGroupingsForStudent(studentId),
  ]);

  // Build restricted grouping map (similar to frontend logic)
  const rgMap: Record<
    string,
    {
      semesters: string[];
      cannotCombineWith: Set<string>;
      categoryCode: string;
    }
  > = {};
  const restrictedCategories: Record<string, boolean> = {};

  for (const rg of restrictedGroupings) {
    const target = rg.subject?.name || "";
    if (!target) continue;

    const semesters = (rg.forClasses || [])
      .map((c: any) =>
        extractSemesterRoman(c.class?.shortName || c.class?.name),
      )
      .filter(Boolean) as string[];

    const cannot = new Set(
      (rg.cannotCombineWithSubjects || [])
        .map((s: any) =>
          normalizeSubjectName(s.cannotCombineWithSubject?.name || ""),
        )
        .filter(Boolean),
    );

    const code = normalizeSubjectName(
      rg.subjectType?.code || rg.subjectType?.name || "",
    );
    const targetKey = normalizeSubjectName(target);

    // Merge with any existing rule for target
    if (!rgMap[targetKey]) {
      rgMap[targetKey] = {
        semesters,
        cannotCombineWith: new Set<string>(),
        categoryCode: code,
      };
    }
    for (const c of cannot) rgMap[targetKey].cannotCombineWith.add(String(c));

    // Ensure symmetric restriction
    for (const c of cannot) {
      if (!c) continue;
      const cKey = String(c);
      if (!rgMap[cKey]) {
        rgMap[cKey] = {
          semesters,
          cannotCombineWith: new Set<string>(),
          categoryCode: code,
        };
      }
      rgMap[cKey].cannotCombineWith.add(targetKey);
    }

    if (code) restrictedCategories[code] = true;
  }

  // Convert DTO array to structured selections for validation
  const structuredSelections: SubjectSelectionData = {};

  // Group selections by subject type and semester
  console.log(
    "🔍 Debug - Starting validation for selections:",
    selections.length,
  );

  for (const selection of selections) {
    const subjectName = selection.subject?.name;

    // Check if this is the enriched format (has subjectType) or simplified format (only has id)
    const hasEnrichedMeta = "subjectType" in selection.subjectSelectionMeta;
    const subjectTypeCode = hasEnrichedMeta
      ? (selection.subjectSelectionMeta as any).subjectType?.code
      : null;

    const category = categorizeSubject(subjectName || "", subjectTypeCode);

    // Use the meta label to determine the category and slot
    const metaLabel = hasEnrichedMeta
      ? (selection.subjectSelectionMeta as any).label
      : null;

    console.log("🔍 Debug - Processing selection:", {
      subjectName,
      subjectTypeCode,
      category,
      metaLabel,
      hasEnrichedMeta,
    });

    if (!subjectName) continue;

    // Use meta label to determine the exact slot instead of extracting semester
    if (metaLabel) {
      if (metaLabel.includes("Minor 1")) {
        structuredSelections.minor1 = subjectName;
      } else if (metaLabel.includes("Minor 2")) {
        structuredSelections.minor2 = subjectName;
      } else if (metaLabel.includes("Minor 3")) {
        structuredSelections.minor2 = subjectName; // Minor 3 maps to minor2 slot
      } else if (metaLabel.includes("IDC 1")) {
        structuredSelections.idc1 = subjectName;
      } else if (metaLabel.includes("IDC 2")) {
        structuredSelections.idc2 = subjectName;
      } else if (metaLabel.includes("IDC 3")) {
        structuredSelections.idc3 = subjectName;
      } else if (metaLabel.includes("AEC")) {
        structuredSelections.aec3 = subjectName;
      } else if (metaLabel.includes("CVAC")) {
        structuredSelections.cvac4 = subjectName;
      }
    }
  }

  console.log("🔍 Debug - Final structured selections:", structuredSelections);

  // Required field validation
  if (
    hasActualOptions(availableSubjects.admissionMinor1Subjects) &&
    !structuredSelections.minor1
  ) {
    errors.push({ field: "minor1", message: "Minor I subject is required" });
  }
  if (
    hasActualOptions(availableSubjects.admissionMinor2Subjects) &&
    !structuredSelections.minor2
  ) {
    errors.push({ field: "minor2", message: "Minor II subject is required" });
  }
  if (
    hasActualOptions(availableSubjects.availableIdcSem1Subjects) &&
    !structuredSelections.idc1
  ) {
    errors.push({ field: "idc1", message: "IDC 1 subject is required" });
  }
  if (
    hasActualOptions(availableSubjects.availableIdcSem2Subjects) &&
    !structuredSelections.idc2
  ) {
    errors.push({ field: "idc2", message: "IDC 2 subject is required" });
  }
  if (
    hasActualOptions(availableSubjects.availableIdcSem3Subjects) &&
    !structuredSelections.idc3
  ) {
    errors.push({ field: "idc3", message: "IDC 3 subject is required" });
  }
  if (
    hasActualOptions(availableSubjects.availableAecSubjects) &&
    !structuredSelections.aec3
  ) {
    errors.push({ field: "aec3", message: "AEC 3 subject is required" });
  }
  if (
    hasActualOptions(availableSubjects.availableCvacOptions) &&
    !structuredSelections.cvac4
  ) {
    errors.push({ field: "cvac4", message: "CVAC 4 subject is required" });
  }

  // Business rule validation - Minor vs IDC conflicts
  if (
    structuredSelections.minor1 &&
    structuredSelections.idc1 &&
    structuredSelections.minor1 === structuredSelections.idc1
  ) {
    errors.push({
      field: "idc1",
      message: "Minor I cannot be the same as IDC 1",
    });
  }
  if (
    structuredSelections.minor1 &&
    structuredSelections.idc2 &&
    structuredSelections.minor1 === structuredSelections.idc2
  ) {
    errors.push({
      field: "idc2",
      message: "Minor I cannot be the same as IDC 2",
    });
  }
  if (
    structuredSelections.minor1 &&
    structuredSelections.idc3 &&
    structuredSelections.minor1 === structuredSelections.idc3
  ) {
    errors.push({
      field: "idc3",
      message: "Minor I cannot be the same as IDC 3",
    });
  }
  if (
    structuredSelections.minor2 &&
    structuredSelections.idc1 &&
    structuredSelections.minor2 === structuredSelections.idc1
  ) {
    errors.push({
      field: "idc1",
      message: "Minor II cannot be the same as IDC 1",
    });
  }
  if (
    structuredSelections.minor2 &&
    structuredSelections.idc2 &&
    structuredSelections.minor2 === structuredSelections.idc2
  ) {
    errors.push({
      field: "idc2",
      message: "Minor II cannot be the same as IDC 2",
    });
  }
  if (
    structuredSelections.minor2 &&
    structuredSelections.idc3 &&
    structuredSelections.minor2 === structuredSelections.idc3
  ) {
    errors.push({
      field: "idc3",
      message: "Minor II cannot be the same as IDC 3",
    });
  }

  // IDC uniqueness validation
  if (
    structuredSelections.idc1 &&
    structuredSelections.idc2 &&
    structuredSelections.idc1 === structuredSelections.idc2
  ) {
    errors.push({
      field: "idc2",
      message: "IDC 1 and IDC 2 cannot be the same",
    });
  }
  if (
    structuredSelections.idc1 &&
    structuredSelections.idc3 &&
    structuredSelections.idc1 === structuredSelections.idc3
  ) {
    errors.push({
      field: "idc3",
      message: "IDC 1 and IDC 3 cannot be the same",
    });
  }
  if (
    structuredSelections.idc2 &&
    structuredSelections.idc3 &&
    structuredSelections.idc2 === structuredSelections.idc3
  ) {
    errors.push({
      field: "idc3",
      message: "IDC 2 and IDC 3 cannot be the same",
    });
  }

  // Auto-assigned subject validation
  if (
    availableSubjects.autoMinor1 &&
    structuredSelections.minor1 !== availableSubjects.autoMinor1 &&
    structuredSelections.minor2 !== availableSubjects.autoMinor1
  ) {
    errors.push({
      field: "minor",
      message: `${availableSubjects.autoMinor1} is mandatory and must be selected in one of the Minor subjects`,
    });
  }

  // Restricted grouping validation
  const validateRestrictedGrouping = (
    subjectName: string,
    categoryCode: string,
    contextSemester: string | string[],
    otherSelections: string[],
  ) => {
    const normalizedSubject = normalizeSubjectName(subjectName);
    const normalizedCategory = normalizeSubjectName(categoryCode);

    if (!restrictedCategories[normalizedCategory]) return;

    const inContext = (rgSemesters: string[]) => {
      if (!contextSemester) return true;
      const set = Array.isArray(contextSemester)
        ? new Set(contextSemester.map((s) => normalizeSubjectName(s)))
        : new Set([normalizeSubjectName(contextSemester)]);
      return (
        rgSemesters.length === 0 ||
        rgSemesters.some((r) => set.has(normalizeSubjectName(r)))
      );
    };

    // Check if any other selection conflicts with this subject
    for (const otherSelection of otherSelections) {
      const rg = rgMap[normalizeSubjectName(otherSelection)];
      if (!rg) continue;
      if (rg.categoryCode !== normalizedCategory) continue;
      if (!inContext(rg.semesters)) continue;
      if (rg.cannotCombineWith.has(normalizedSubject)) {
        errors.push({
          field: categoryCode.toLowerCase(),
          message: `${subjectName} cannot be combined with ${otherSelection}`,
        });
        return;
      }
    }

    // Check if this subject conflicts with any other selection
    const candidateRg = rgMap[normalizedSubject];
    if (candidateRg && candidateRg.categoryCode === normalizedCategory) {
      if (!inContext(candidateRg.semesters)) return;
      for (const otherSelection of otherSelections) {
        const selRg = rgMap[normalizeSubjectName(otherSelection)];
        if (!selRg || selRg.categoryCode !== normalizedCategory) continue;
        if (
          candidateRg.cannotCombineWith.has(
            normalizeSubjectName(otherSelection),
          )
        ) {
          errors.push({
            field: categoryCode.toLowerCase(),
            message: `${subjectName} cannot be combined with ${otherSelection}`,
          });
          return;
        }
      }
    }
  };

  // Validate Minor subjects against each other
  if (structuredSelections.minor1 && structuredSelections.minor2) {
    validateRestrictedGrouping(
      structuredSelections.minor1,
      "MN",
      ["I", "II"],
      [structuredSelections.minor2],
    );
    validateRestrictedGrouping(
      structuredSelections.minor2,
      "MN",
      ["III", "IV"],
      [structuredSelections.minor1],
    );
  }

  // Validate IDC subjects against each other
  const idcSelections = [
    structuredSelections.idc1,
    structuredSelections.idc2,
    structuredSelections.idc3,
  ].filter((s): s is string => Boolean(s));
  if (structuredSelections.idc1) {
    validateRestrictedGrouping(
      structuredSelections.idc1,
      "IDC",
      "I",
      idcSelections.filter((s) => s !== structuredSelections.idc1),
    );
  }
  if (structuredSelections.idc2) {
    validateRestrictedGrouping(
      structuredSelections.idc2,
      "IDC",
      "II",
      idcSelections.filter((s) => s !== structuredSelections.idc2),
    );
  }
  if (structuredSelections.idc3) {
    validateRestrictedGrouping(
      structuredSelections.idc3,
      "IDC",
      "III",
      idcSelections.filter((s) => s !== structuredSelections.idc3),
    );
  }

  return errors;
}

// -- CRUD --------------------------------------------------------------------

export async function createStudentSubjectSelection(
  data: StudentSubjectSelection,
): Promise<StudentSubjectSelectionDto> {
  const [created] = await db
    .insert(studentSubjectSelectionModel)
    .values(data)
    .returning();
  return (await getStudentSubjectSelectionById(
    created.id as number,
  )) as StudentSubjectSelectionDto;
}

export async function createStudentSubjectSelectionFromDto(
  input: CreateStudentSubjectSelectionDtoInput,
): Promise<StudentSubjectSelectionDto> {
  const base: StudentSubjectSelection = {
    studentId: input.studentId,
    sessionId: input.session.id,
    subjectSelectionMetaId: input.subjectSelectionMeta.id,
    subjectId: input.subject.id,
  } as StudentSubjectSelection;
  const [created] = await db
    .insert(studentSubjectSelectionModel)
    .values(base)
    .returning();
  return (await getStudentSubjectSelectionById(
    created.id as number,
  )) as StudentSubjectSelectionDto;
}

export async function getStudentSubjectSelectionById(
  id: number,
): Promise<StudentSubjectSelectionDto | null> {
  const [row] = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(eq(studentSubjectSelectionModel.id, id));
  if (!row) return null;
  return await modelToDto(row as StudentSubjectSelectionT);
}

export async function getStudentSubjectSelectionsPaginated(options: {
  page: number;
  pageSize: number;
  studentId?: number;
  sessionId?: number;
}): Promise<PaginatedResponse<StudentSubjectSelectionDto>> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize || 10));
  const offset = (page - 1) * pageSize;

  const whereExpr =
    options.studentId && options.sessionId
      ? and(
          eq(studentSubjectSelectionModel.studentId, options.studentId),
          eq(studentSubjectSelectionModel.sessionId, options.sessionId),
        )
      : options.studentId
        ? eq(studentSubjectSelectionModel.studentId, options.studentId)
        : options.sessionId
          ? eq(studentSubjectSelectionModel.sessionId, options.sessionId)
          : undefined;

  const rows = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(whereExpr)
    .orderBy(desc(studentSubjectSelectionModel.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: countDistinct(studentSubjectSelectionModel.id) })
    .from(studentSubjectSelectionModel)
    .where(whereExpr);

  const content = await Promise.all(
    rows.map((r) => modelToDto(r as StudentSubjectSelectionT)),
  );
  const totalElements = Number(count || 0);
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  return { content, page, pageSize, totalPages, totalElements };
}

export async function updateStudentSubjectSelection(
  id: number,
  data: Partial<StudentSubjectSelection>,
): Promise<StudentSubjectSelectionDto> {
  const [updated] = await db
    .update(studentSubjectSelectionModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(studentSubjectSelectionModel.id, id))
    .returning();
  const dto = await getStudentSubjectSelectionById(updated.id as number);
  if (!dto)
    throw new Error("Failed to retrieve updated StudentSubjectSelection");
  return dto;
}

export async function updateStudentSubjectSelectionFromDto(
  id: number,
  input: UpdateStudentSubjectSelectionDtoInput,
): Promise<StudentSubjectSelectionDto> {
  const partial: Partial<StudentSubjectSelection> = {};
  if (typeof input.studentId === "number") partial.studentId = input.studentId;
  if (input.session?.id) partial.sessionId = input.session.id;
  if (input.subjectSelectionMeta?.id)
    partial.subjectSelectionMetaId = input.subjectSelectionMeta.id;
  if (input.subject?.id) partial.subjectId = input.subject.id;
  return await updateStudentSubjectSelection(id, partial);
}

export async function deleteStudentSubjectSelection(id: number) {
  const [deleted] = await db
    .delete(studentSubjectSelectionModel)
    .where(eq(studentSubjectSelectionModel.id, id))
    .returning();
  return deleted;
}

// Create multiple subject selections with validation (Student/Admin version - creates initial version)
export async function createStudentSubjectSelectionsWithValidation(
  selections: StudentSubjectSelectionInput[],
  createdBy?: number,
  changeReason?: string,
  userType?: string,
): Promise<{
  success: boolean;
  errors?: SubjectSelectionValidationError[];
  data?: StudentSubjectSelectionDto[];
}> {
  console.log(
    "[backend] createStudentSubjectSelectionsWithValidation called with:",
    {
      selectionsLength: selections.length,
      createdBy,
      changeReason,
      userType,
    },
  );

  if (selections.length === 0) {
    console.log("[backend] No selections provided, returning empty result");
    return { success: true, data: [] };
  }

  // Extract studentId and sessionId from first selection
  const studentId = selections[0].studentId;
  const sessionId = selections[0].session.id;

  // Validate user exists if createdBy is provided
  if (createdBy) {
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, createdBy));

    if (!user) {
      return {
        success: false,
        errors: [
          {
            field: "createdBy",
            message: "User not found",
          },
        ],
      };
    }
  }

  // Check if student already has selections (prevent duplicate creation)
  const existingSelections = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(
      and(
        eq(studentSubjectSelectionModel.studentId, studentId),
        eq(studentSubjectSelectionModel.sessionId, sessionId),
        eq(studentSubjectSelectionModel.isActive, true),
      ),
    );

  // Check if student already has selections (prevent duplicate creation for students, allow admins to override)
  if (existingSelections.length > 0 && userType === "STUDENT") {
    return {
      success: false,
      errors: [
        {
          field: "general",
          message:
            "Student already has active subject selections. Only admin can update them.",
        },
      ],
    };
  }

  // If admin is creating and selections exist, mark existing ones as deprecated
  if (existingSelections.length > 0 && userType === "ADMIN") {
    console.log(
      `Admin overriding existing selections for student ${studentId}`,
    );

    // Mark existing selections as deprecated
    await db
      .update(studentSubjectSelectionModel)
      .set({
        isDeprecated: true,
        isActive: false,
      })
      .where(
        and(
          eq(studentSubjectSelectionModel.studentId, studentId),
          eq(studentSubjectSelectionModel.sessionId, sessionId),
          eq(studentSubjectSelectionModel.isActive, true),
        ),
      );
  }

  // Enrich selections with full subjectSelectionMeta data for validation
  console.log(
    "🔍 Debug - Original selections:",
    JSON.stringify(selections, null, 2),
  );

  // Debug: Check what meta IDs exist in the database
  const allMetas = await db.select().from(subjectSelectionMetaModel);
  console.log(
    "🔍 Debug - All existing meta IDs:",
    allMetas.map((m) => ({
      id: m.id,
      label: m.label,
      subjectTypeId: m.subjectTypeId,
    })),
  );

  // Debug: Check what meta IDs are being requested
  const requestedIds = selections.map((s) => s.subjectSelectionMeta.id);
  console.log("🔍 Debug - Requested meta IDs:", requestedIds);

  // Debug: Try to load default metas if none exist
  if (allMetas.length === 0) {
    console.log(
      "🔍 Debug - No metas found, attempting to load default metas...",
    );
    try {
      const { loadDefaultSubjectSelectionMetas } = await import(
        "./subject-selection-meta.service.js"
      );
      await loadDefaultSubjectSelectionMetas();
      console.log("🔍 Debug - Default metas loaded successfully");

      // Check again after loading
      const newMetas = await db.select().from(subjectSelectionMetaModel);
      console.log(
        "🔍 Debug - Meta IDs after loading defaults:",
        newMetas.map((m) => ({
          id: m.id,
          label: m.label,
          subjectTypeId: m.subjectTypeId,
        })),
      );
    } catch (error) {
      console.log("🔍 Debug - Error loading default metas:", error);
    }
  }

  const enrichedSelections = await Promise.all(
    selections.map(async (selection) => {
      // Fetch full subjectSelectionMeta data with subjectType
      if (!selection.subjectSelectionMeta?.id) {
        console.log("❌ No meta ID for selection:", selection);
        return selection; // Return original if no id
      }

      const [meta] = await db
        .select()
        .from(subjectSelectionMetaModel)
        .where(
          eq(subjectSelectionMetaModel.id, selection.subjectSelectionMeta.id),
        );

      if (!meta) {
        console.log(
          "❌ Meta not found for ID:",
          selection.subjectSelectionMeta.id,
        );
        return selection; // Return original if meta not found
      }

      // Fetch subjectType
      const [subjectType] = await db
        .select()
        .from(subjectTypeModel)
        .where(eq(subjectTypeModel.id, meta.subjectTypeId));

      // Fetch classes
      const classes = await db
        .select({
          class: {
            id: classModel.id,
            name: classModel.name,
          },
        })
        .from(subjectSelectionMetaClassModel)
        .leftJoin(
          classModel,
          eq(subjectSelectionMetaClassModel.classId, classModel.id),
        )
        .where(
          eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, meta.id),
        );

      const enrichedMeta = {
        id: meta.id,
        label: meta.label,
        subjectTypeId: meta.subjectTypeId,
        academicYearId: meta.academicYearId,
        subjectType: subjectType || null,
        forClasses: classes.map((c) => c.class).filter(Boolean),
      };

      console.log("✅ Enriched selection:", {
        subject: selection.subject.name,
        metaId: meta.id,
        metaLabel: meta.label,
        subjectType: subjectType?.code,
        classes: classes.map((c) => c.class?.name).filter(Boolean),
      });

      return {
        ...selection,
        subjectSelectionMeta: enrichedMeta,
      };
    }),
  );

  console.log(
    "🔍 Debug - Enriched selections:",
    JSON.stringify(enrichedSelections, null, 2),
  );

  // Validate the enriched selections
  const validationErrors = await validateStudentSubjectSelections(
    studentId,
    enrichedSelections,
  );

  if (validationErrors.length > 0) {
    return { success: false, errors: validationErrors };
  }

  // Prepare data for insertion (Version 1 - Initial creation)
  const insertData: StudentSubjectSelection[] = [];

  for (const selection of enrichedSelections) {
    insertData.push({
      studentId: selection.studentId,
      sessionId: selection.session.id,
      subjectSelectionMetaId: selection.subjectSelectionMeta.id,
      subjectId: selection.subject.id,
      version: 1,
      parentId: null, // No parent for initial version
      isDeprecated: false,
      isActive: true,
      createdBy: createdBy || null,
      changeReason: null, // No change reason for initial selections
    } as StudentSubjectSelection);
  }

  // Insert all selections
  const createdSelections = await db
    .insert(studentSubjectSelectionModel)
    .values(insertData)
    .returning();

  // Convert to DTOs
  const dtos = await Promise.all(
    createdSelections.map((selection) =>
      modelToDto(selection as StudentSubjectSelectionT),
    ),
  );

  // Enqueue confirmation notifications (email and WhatsApp) - non-blocking
  try {
    console.log(
      "[backend] Starting notification enqueueing process for student:",
      studentId,
    );

    const [student] = await db
      .select({ userId: studentModel.userId })
      .from(studentModel)
      .where(eq(studentModel.id, studentId))
      .limit(1);

    console.log("[backend] Student lookup result:", {
      student,
      hasUserId: !!student?.userId,
    });

    if (student?.userId) {
      console.log(
        "[backend] Student has userId, proceeding with notification setup",
      );
      // Get student's stream information
      const streamInfo = await getStudentStreamInfo(studentId);
      const streamName = streamInfo?.streamName || "BA"; // Default fallback

      console.log("[backend] Student stream info (create):", {
        studentId,
        streamName,
        streamInfo,
        usingFallback: !streamInfo?.streamName,
      });

      const rowsForGrid = dtos.map((d) => ({
        metaLabel: (d.subjectSelectionMeta as any)?.label || "",
        subjectName: d.subject?.name || "",
      }));

      // Get academic year name from the first DTO's subjectSelectionMeta
      let academicYearName = "";
      if (dtos.length > 0 && dtos[0]?.subjectSelectionMeta) {
        const meta = dtos[0].subjectSelectionMeta as any;
        academicYearName = meta.academicYear?.name || "";
      }

      console.log("[backend] Academic year extraction (create):", {
        dtosLength: dtos.length,
        academicYearName,
        firstMeta: dtos[0]?.subjectSelectionMeta ? "exists" : "missing",
        firstMetaDetails: dtos[0]?.subjectSelectionMeta
          ? {
              hasAcademicYear: !!(dtos[0].subjectSelectionMeta as any)
                ?.academicYear,
              academicYearName: (dtos[0].subjectSelectionMeta as any)
                ?.academicYear?.name,
            }
          : null,
      });

      // Get notification master IDs for both EMAIL and WHATSAPP
      const emailMasterName = getNotificationMasterNameByStream(
        streamName,
        "EMAIL",
      );
      const whatsappMasterName = getNotificationMasterNameByStream(
        streamName,
        "WHATSAPP",
      );

      const [emailMasterId, whatsappMasterId] = await Promise.all([
        getNotificationMasterIdByName(emailMasterName),
        getNotificationMasterIdByName(whatsappMasterName),
      ]);

      console.log("[backend] enqueue subject-selection (create) ->", {
        userId: student.userId,
        streamName,
        emailMasterName,
        whatsappMasterName,
        emailMasterId,
        whatsappMasterId,
        academicYearName,
      });

      console.log("[backend] DEBUG: Notification master IDs verification:", {
        emailMasterId,
        whatsappMasterId,
        emailMasterName,
        whatsappMasterName,
      });

      // Build per-field content rows from notification master meta
      let contentRows: Array<{ whatsappFieldId: number; content: string }> = [];
      if (emailMasterId) {
        const { notificationMasterMetaModel } = await import(
          "@repo/db/schemas/models/notifications/notification-master-meta.model"
        );
        const { notificationMasterFieldModel } = await import(
          "@repo/db/schemas/models/notifications/notification-master-field.model"
        );

        console.log("[backend] notification master ID:", emailMasterId);
        console.log(
          "[backend] rowsForGrid for content mapping:",
          JSON.stringify(rowsForGrid, null, 2),
        );

        console.log(
          "[backend] Fetching metas for emailMasterId:",
          emailMasterId,
        );
        const metas = await db
          .select({
            fieldId: notificationMasterMetaModel.notificationMasterFieldId,
            sequence: notificationMasterMetaModel.sequence,
            flag: notificationMasterMetaModel.flag,
          })
          .from(notificationMasterMetaModel)
          .where(
            eq(notificationMasterMetaModel.notificationMasterId, emailMasterId),
          );
        console.log(
          "[backend] Raw metas query result:",
          JSON.stringify(metas, null, 2),
        );
        const activeMetas = metas
          .filter((m) => m.flag === true)
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

        console.log(
          "[backend] notification master metas:",
          JSON.stringify(activeMetas, null, 2),
        );

        const fieldIds = activeMetas.map((m) => m.fieldId as number);
        if (fieldIds.length > 0) {
          const fields = await db
            .select({
              id: notificationMasterFieldModel.id,
              name: notificationMasterFieldModel.name,
            })
            .from(notificationMasterFieldModel)
            .where(inArray(notificationMasterFieldModel.id, fieldIds));

          console.log(
            "[backend] notification master fields:",
            JSON.stringify(fields, null, 2),
          );

          const nameById = new Map(
            fields.map((f) => [f.id as number, String(f.name)]),
          );

          console.log(
            "[backend] subject selection meta labels from rowsForGrid:",
            JSON.stringify(rowsForGrid, null, 2),
          );

          // Build values: academicYear and each selection label -> selected subject name
          const normalize = (s: string) =>
            String(s || "")
              .normalize("NFKD")
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "");
          const labelToValue: Record<string, string> = {};

          // Get student name for Name field
          const [studentUser] = await db
            .select({ name: userModel.name })
            .from(studentModel)
            .leftJoin(userModel, eq(studentModel.userId, userModel.id))
            .where(eq(studentModel.id, studentId))
            .limit(1);

          console.log("[backend] Student user lookup:", {
            studentId,
            studentUser,
            studentName: studentUser?.name,
          });

          // Support common key variants for academic year
          labelToValue[normalize("academicYear")] = academicYearName;
          labelToValue[normalize("Academic Year")] = academicYearName;
          labelToValue[normalize("Name")] = studentUser?.name || "Student";
          labelToValue[normalize("Student Name")] =
            studentUser?.name || "Student";

          for (const r of rowsForGrid) {
            labelToValue[normalize(r.metaLabel)] = r.subjectName;
          }

          console.log(
            "[backend] normalized labelToValue mapping:",
            JSON.stringify(labelToValue, null, 2),
          );

          console.log("[backend] DEBUG: Field mapping analysis:", {
            rowsForGrid: rowsForGrid.map((r) => ({
              metaLabel: r.metaLabel,
              subjectName: r.subjectName,
            })),
            notificationMasterFields: fields.map((f) => ({
              id: f.id,
              name: f.name,
            })),
            activeMetas: activeMetas.map((m) => ({
              fieldId: m.fieldId,
              sequence: m.sequence,
            })),
          });

          const resolveValueForField = (rawName: string) => {
            const key = normalize(rawName);
            let value = labelToValue[key];
            if (value) return value;

            console.log(
              `[backend] Field mapping attempt: "${rawName}" -> normalized: "${key}"`,
            );
            console.log(`[backend] Available keys:`, Object.keys(labelToValue));

            // Handle combined semester labels like "Semester III & IV"
            if (/SEMESTERIIIIV/.test(key)) {
              // Try specific semester variants
              const variantA = key.replace("SEMESTERIIIIV", "SEMESTERIII");
              const variantB = key.replace("SEMESTERIIIIV", "SEMESTERIV");
              value = labelToValue[variantA] || labelToValue[variantB] || "";
              console.log(
                `[backend] Combined semester mapping: ${key} -> ${variantA}/${variantB} -> "${value}"`,
              );
              return value;
            }
            // Alternative tokenization: sometimes master label may be "III&IV" without 'SEMESTER'
            if (/IIIIV/.test(key) && !/SEMESTER/.test(key)) {
              const variantA = key.replace("IIIIV", "III");
              const variantB = key.replace("IIIIV", "IV");
              value = labelToValue[variantA] || labelToValue[variantB] || "";
              console.log(
                `[backend] Alternative semester mapping: ${key} -> ${variantA}/${variantB} -> "${value}"`,
              );
              return value;
            }

            // Try partial matching for common field names
            const partialMatches = Object.keys(labelToValue).filter(
              (k) => k.includes(key) || key.includes(k),
            );
            if (partialMatches.length > 0) {
              value = labelToValue[partialMatches[0]];
              console.log(
                `[backend] Partial match found: ${key} -> ${partialMatches[0]} -> "${value}"`,
              );
              return value;
            }

            console.log(
              `[backend] No match found for: "${rawName}" (normalized: "${key}")`,
            );
            return "";
          };

          // Only include fields that have actual values (not empty or fallback values)
          contentRows = activeMetas
            .map((m) => {
              const rawName = nameById.get(m.fieldId as number) || "";
              let value = resolveValueForField(rawName);

              console.log(
                `[backend] Field mapping attempt: rawName="${rawName}", initial value="${value}"`,
              );

              // Only apply fallback for Name and Academic Year fields
              if (!value || value.trim() === "") {
                if (rawName.toLowerCase().includes("name")) {
                  value = studentUser?.name || "Student";
                } else if (
                  rawName.toLowerCase().includes("academic") ||
                  rawName.toLowerCase().includes("year")
                ) {
                  value = academicYearName || "2024-25";
                }
                // Don't apply fallbacks for subject fields - only include if student actually selected them
              }

              console.log(
                `[backend] Final field mapping: rawName="${rawName}" -> value="${value}"`,
              );

              return {
                whatsappFieldId: m.fieldId as number,
                content: String(value ?? ""),
                rawName: rawName,
                hasValue:
                  value &&
                  value.trim() !== "" &&
                  !value.includes("Subject Selection Pending") &&
                  !value.includes("IDC Subject") &&
                  !value.includes("AEC Subject") &&
                  !value.includes("CVAC Subject"),
              };
            })
            .filter(
              (row) =>
                row.hasValue ||
                row.rawName.toLowerCase().includes("name") ||
                row.rawName.toLowerCase().includes("academic") ||
                row.rawName.toLowerCase().includes("year"),
            ) // Always include Name and Academic Year
            .map((row) => ({
              whatsappFieldId: row.whatsappFieldId,
              content: row.content,
            }));

          console.log(
            "[backend] final contentRows:",
            JSON.stringify(contentRows, null, 2),
          );

          console.log("[backend] Debug - Field mapping details:", {
            rowsForGrid,
            labelToValue,
            activeMetas: activeMetas.map((m) => ({
              fieldId: m.fieldId,
              sequence: m.sequence,
              flag: m.flag,
            })),
            fields: fields.map((f) => ({
              id: f.id,
              name: f.name,
            })),
          });
        }
      }

      // Filter contentRows for email based on stream
      let emailContentRows = contentRows;
      if (
        streamInfo?.streamName === "BSC" ||
        streamInfo?.streamName === "Science" ||
        whatsappMasterName === "Subject Selection Confirmation - BSC"
      ) {
        // For BSC students, exclude "Minor 3" field from email content
        emailContentRows = contentRows.filter(
          (row) => row.whatsappFieldId !== 8, // Exclude Minor 3 (field ID 8)
        );
        console.log(
          "[backend] BSC email: Filtered out Minor 3 field, using",
          emailContentRows.length,
          "content rows",
        );
      }

      // Enqueue EMAIL notification
      await enqueueNotification({
        userId: student.userId as number,
        variant: "EMAIL",
        type: "INFO",
        message: "Confirmation of Semester-wise Subject Selection",
        notificationMasterId: emailMasterId,
        notificationEvent: {
          subject: "Confirmation of Semester-wise Subject Selection",
          templateData: {
            academicYear: academicYearName,
          },
          meta: { devOnly: true },
        },
        content: emailContentRows,
      });

      // Enqueue WHATSAPP notification with stream-specific master
      let whatsappBodyValues = contentRows.map((row) => row.content);

      // TEMPORARY FIX: Limit values based on template compatibility
      if (whatsappMasterName === "Subject Selection Confirmation - BA") {
        whatsappBodyValues = whatsappBodyValues.slice(0, 7);
        console.log(
          "[backend] BA template: Limited bodyValues to 7 items:",
          whatsappBodyValues,
        );
      } else if (
        whatsappMasterName === "Subject Selection Confirmation - BSC"
      ) {
        // BSC template expects 8 parameters - exclude "Minor 3" field
        // Filter out Minor 3 by using the contentRows instead of hardcoded indices
        const filteredContentRows = contentRows.filter(
          (row) => row.whatsappFieldId !== 8, // Exclude Minor 3 (field ID 8)
        );
        whatsappBodyValues = filteredContentRows.map((row) => row.content);
        console.log(
          "[backend] BSC template: Excluded Minor 3 field, using 8 items:",
          whatsappBodyValues,
        );
      } else if (
        whatsappMasterName === "Subject Selection Confirmation - BCOM"
      ) {
        // BCOM template expects exactly 2 parameters: Name, Minor
        if (whatsappBodyValues.length === 2) {
          // Perfect - already has Name and one subject
          console.log(
            "[backend] BCOM template: Using 2 items as-is:",
            whatsappBodyValues,
          );
        } else if (whatsappBodyValues.length > 2) {
          // Take only the first 2 items (Name and first subject)
          whatsappBodyValues = whatsappBodyValues.slice(0, 2);
          console.log(
            "[backend] BCOM template: Limited to first 2 items:",
            whatsappBodyValues,
          );
        }
      }

      console.log("[backend] WhatsApp notification details:", {
        whatsappMasterId,
        whatsappMasterName,
        contentRowsLength: contentRows.length,
        whatsappBodyValuesLength: whatsappBodyValues.length,
        whatsappBodyValues,
        contentRows,
      });

      await enqueueNotification({
        userId: student.userId as number,
        variant: "WHATSAPP",
        type: "INFO",
        message: "Subject Selection Confirmation",
        notificationMasterId: whatsappMasterId,
        notificationEvent: {
          notificationMaster: { id: whatsappMasterId } as any,
          bodyValues: whatsappBodyValues,
          meta: { devOnly: true },
        } as any,
        content: contentRows,
      });

      console.log("[backend] enqueue subject-selection (create) <- done");
    }
  } catch (err) {
    console.log("[Notif] enqueue failed (create):", err);
  }

  console.log(
    "[backend] createStudentSubjectSelectionsWithValidation completed successfully, returning:",
    {
      success: true,
      dataLength: dtos.length,
    },
  );

  // Emit MIS table updates via socket
  const affectedStudentIds = Array.from(
    new Set(selections.map((s) => s.studentId)),
  );
  await emitMisTableUpdates(affectedStudentIds);

  return { success: true, data: dtos };
}

// Update multiple subject selections with validation (Admin version - creates new version)
export async function updateStudentSubjectSelectionsWithValidation(
  studentId: number,
  sessionId: number,
  selections: StudentSubjectSelectionDto[],
  updatedBy?: number,
  changeReason?: string,
): Promise<{
  success: boolean;
  errors?: SubjectSelectionValidationError[];
  data?: StudentSubjectSelectionDto[];
}> {
  // Validate user exists if updatedBy is provided
  if (updatedBy) {
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, updatedBy));

    if (!user) {
      return {
        success: false,
        errors: [
          {
            field: "updatedBy",
            message: "User not found",
          },
        ],
      };
    }
  }

  // Validate the selections first
  const validationErrors = await validateStudentSubjectSelections(
    studentId,
    selections,
  );

  if (validationErrors.length > 0) {
    return { success: false, errors: validationErrors };
  }

  // Get current active selections to determine next version
  const currentSelections = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(
      and(
        eq(studentSubjectSelectionModel.studentId, studentId),
        eq(studentSubjectSelectionModel.sessionId, sessionId),
        eq(studentSubjectSelectionModel.isActive, true),
      ),
    );

  if (currentSelections.length === 0) {
    return {
      success: false,
      errors: [
        {
          field: "general",
          message: "No active selections found to update",
        },
      ],
    };
  }

  // Get ALL selections (including deprecated) to find the original/first entry for each metaId
  const allSelections = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(
      and(
        eq(studentSubjectSelectionModel.studentId, studentId),
        eq(studentSubjectSelectionModel.sessionId, sessionId),
      ),
    )
    .orderBy(studentSubjectSelectionModel.createdAt);

  // Create map of original/first entries for each metaId
  const originalSelectionsMap = new Map<number, StudentSubjectSelection>();
  allSelections.forEach((selection) => {
    if (!originalSelectionsMap.has(selection.subjectSelectionMetaId)) {
      originalSelectionsMap.set(selection.subjectSelectionMetaId, selection);
    }
  });

  // Determine next version number
  const maxVersion = Math.max(...currentSelections.map((s) => s.version || 1));
  const nextVersion = maxVersion + 1;

  // Mark current selections as deprecated and inactive
  await db
    .update(studentSubjectSelectionModel)
    .set({
      isDeprecated: true,
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(studentSubjectSelectionModel.studentId, studentId),
        eq(studentSubjectSelectionModel.sessionId, sessionId),
        eq(studentSubjectSelectionModel.isActive, true),
      ),
    );

  // Create new version of selections
  const insertData: StudentSubjectSelection[] = [];

  for (const selection of selections) {
    // Find the original/first selection for this metaId to get parentId
    const metaId = selection.subjectSelectionMeta.id;
    const originalSelection = metaId
      ? originalSelectionsMap.get(metaId)
      : undefined;

    insertData.push({
      studentId: selection.studentId,
      sessionId: selection.session.id,
      subjectSelectionMetaId: selection.subjectSelectionMeta.id,
      subjectId: selection.subject.id,
      version: nextVersion,
      parentId: originalSelection?.id || null, // Link to original/first entry
      isDeprecated: false,
      isActive: true,
      createdBy: updatedBy || null,
      changeReason: changeReason || `Admin update - Version ${nextVersion}`,
    } as StudentSubjectSelection);
  }

  // Insert new version selections
  const createdSelections = await db
    .insert(studentSubjectSelectionModel)
    .values(insertData)
    .returning();

  // Convert to DTOs
  const dtos = await Promise.all(
    createdSelections.map((selection) =>
      modelToDto(selection as StudentSubjectSelectionT),
    ),
  );

  return { success: true, data: dtos };
}

// Get subject selection meta data for UI form
export async function getSubjectSelectionMetaForStudent(
  studentId: number,
): Promise<{
  subjectSelectionMetas: SubjectSelectionMetaDto[];
  availableSubjects: AvailableSubjects;
}> {
  // Get available subjects first
  const availableSubjects = await getAvailableSubjectsForStudent(studentId);

  // Get the student's data which includes academic year information
  const studentData =
    await studentSubjectsService.findSubjectsSelections(studentId);

  // Use the subject selection metas that are already properly filtered by academic year
  const subjectSelectionMetas = studentData.subjectSelectionMetas;

  // The subjectSelectionMetas are already properly formatted DTOs from findSubjectsSelections

  return {
    subjectSelectionMetas,
    availableSubjects,
  };
}

// -- Version History and Audit Trail Functions --

// Get version history for a student's subject selections
export async function getStudentSubjectSelectionVersionHistory(
  studentId: number,
  sessionId?: number,
): Promise<StudentSubjectSelectionDto[]> {
  const whereExpr = sessionId
    ? and(
        eq(studentSubjectSelectionModel.studentId, studentId),
        eq(studentSubjectSelectionModel.sessionId, sessionId),
      )
    : eq(studentSubjectSelectionModel.studentId, studentId);

  const rows = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(whereExpr)
    .orderBy(
      desc(studentSubjectSelectionModel.version),
      desc(studentSubjectSelectionModel.createdAt),
    );

  return Promise.all(
    rows.map((r) => modelToDto(r as StudentSubjectSelectionT)),
  );
}

// Get current active selections for a student
export async function getCurrentActiveSelections(
  studentId: number,
  sessionId?: number,
): Promise<StudentSubjectSelectionDto[]> {
  const whereExpr = sessionId
    ? and(
        eq(studentSubjectSelectionModel.studentId, studentId),
        eq(studentSubjectSelectionModel.sessionId, sessionId),
        eq(studentSubjectSelectionModel.isActive, true),
      )
    : and(
        eq(studentSubjectSelectionModel.studentId, studentId),
        eq(studentSubjectSelectionModel.isActive, true),
      );

  const rows = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(whereExpr)
    .orderBy(desc(studentSubjectSelectionModel.createdAt));

  return Promise.all(
    rows.map((r) => modelToDto(r as StudentSubjectSelectionT)),
  );
}

// Get audit trail for a specific subject selection (all versions)
export async function getSubjectSelectionAuditTrail(
  subjectSelectionMetaId: number,
  studentId: number,
): Promise<StudentSubjectSelectionDto[]> {
  const rows = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(
      and(
        eq(
          studentSubjectSelectionModel.subjectSelectionMetaId,
          subjectSelectionMetaId,
        ),
        eq(studentSubjectSelectionModel.studentId, studentId),
      ),
    )
    .orderBy(
      desc(studentSubjectSelectionModel.version),
      desc(studentSubjectSelectionModel.createdAt),
    );

  return Promise.all(
    rows.map((r) => modelToDto(r as StudentSubjectSelectionT)),
  );
}

// Check if student can create new selections (no active selections exist)
export async function canStudentCreateSelections(
  studentId: number,
  sessionId: number,
): Promise<boolean> {
  const existingSelections = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(
      and(
        eq(studentSubjectSelectionModel.studentId, studentId),
        eq(studentSubjectSelectionModel.sessionId, sessionId),
        eq(studentSubjectSelectionModel.isActive, true),
      ),
    )
    .limit(1);

  return existingSelections.length === 0;
}

// Get selection statistics for reporting
export async function getSelectionStatistics(studentId: number): Promise<{
  totalVersions: number;
  currentVersion: number;
  hasActiveSelections: boolean;
  lastUpdated: Date | null;
  changeHistory: Array<{
    version: number;
    createdAt: Date;
    createdBy: number | null;
    changeReason: string | null;
    isActive: boolean;
  }>;
}> {
  const allSelections = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(eq(studentSubjectSelectionModel.studentId, studentId))
    .orderBy(
      desc(studentSubjectSelectionModel.version),
      desc(studentSubjectSelectionModel.createdAt),
    );

  const activeSelections = allSelections.filter((s) => s.isActive);
  const currentVersion =
    activeSelections.length > 0
      ? Math.max(...activeSelections.map((s) => s.version || 1))
      : 0;

  // Get unique versions for change history
  const versionMap = new Map<number, any>();
  for (const selection of allSelections) {
    const version = selection.version || 1;
    if (!versionMap.has(version)) {
      versionMap.set(version, {
        version,
        createdAt: selection.createdAt,
        createdBy: selection.createdBy,
        changeReason: selection.changeReason,
        isActive: selection.isActive,
      });
    }
  }

  return {
    totalVersions: versionMap.size,
    currentVersion,
    hasActiveSelections: activeSelections.length > 0,
    lastUpdated: allSelections.length > 0 ? allSelections[0].createdAt : null,
    changeHistory: Array.from(versionMap.values()).sort(
      (a, b) => b.version - a.version,
    ),
  };
}

// Efficient admin update function - only updates changed selections with proper parent relationships
export async function updateStudentSubjectSelectionsEfficiently(
  selections: StudentSubjectSelectionInput[],
  createdBy?: number,
  changeReason?: string,
): Promise<{
  success: boolean;
  errors?: SubjectSelectionValidationError[];
  data?: StudentSubjectSelection[];
}> {
  console.log(
    "🚨 [backend] updateStudentSubjectSelectionsEfficiently function called!",
  );
  console.log(
    "[backend] updateStudentSubjectSelectionsEfficiently called with:",
    {
      selectionsLength: selections.length,
      createdBy,
      changeReason,
    },
  );

  if (selections.length === 0) {
    console.log("[backend] No selections provided, returning empty result");
    return { success: true, data: [] };
  }

  // Extract studentId and sessionId from first selection
  const studentId = selections[0].studentId;
  const sessionId = selections[0].session.id;

  console.log(
    `🔍 Efficient Update - Processing ${selections.length} selections for student ${studentId}`,
  );

  // Get current active selections
  const currentSelections = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(
      and(
        eq(studentSubjectSelectionModel.studentId, studentId),
        eq(studentSubjectSelectionModel.sessionId, sessionId),
        eq(studentSubjectSelectionModel.isActive, true),
      ),
    );

  console.log(`🔍 Current active selections: ${currentSelections.length}`);

  // Get ALL selections (including deprecated) to find the original/first entry for each metaId
  const allSelections = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(
      and(
        eq(studentSubjectSelectionModel.studentId, studentId),
        eq(studentSubjectSelectionModel.sessionId, sessionId),
      ),
    )
    .orderBy(studentSubjectSelectionModel.createdAt);

  console.log(
    `🔍 All selections (including deprecated): ${allSelections.length}`,
  );

  // Create maps for easy comparison
  const currentSelectionsMap = new Map<number, StudentSubjectSelection>();
  const originalSelectionsMap = new Map<number, StudentSubjectSelection>();

  currentSelections.forEach((selection) => {
    currentSelectionsMap.set(selection.subjectSelectionMetaId, selection);
  });

  // Find the original/first entry for each metaId
  allSelections.forEach((selection) => {
    if (!originalSelectionsMap.has(selection.subjectSelectionMetaId)) {
      originalSelectionsMap.set(selection.subjectSelectionMetaId, selection);
    }
  });

  // Find what has actually changed
  const changedSelections: StudentSubjectSelectionInput[] = [];
  const unchangedSelections: StudentSubjectSelection[] = [];

  for (const newSelection of selections) {
    const metaId = newSelection.subjectSelectionMeta.id;
    const currentSelection = currentSelectionsMap.get(metaId);

    if (!currentSelection) {
      // New selection (metaId not in current selections)
      console.log(
        `🆕 New selection for metaId ${metaId}: ${newSelection.subject.name}`,
      );
      changedSelections.push(newSelection);
    } else if (currentSelection.subjectId !== newSelection.subject.id) {
      // Changed selection (different subject)
      console.log(
        `🔄 Changed selection for metaId ${metaId}: ${currentSelection.subjectId} -> ${newSelection.subject.id}`,
      );
      changedSelections.push(newSelection);
    } else {
      // Unchanged selection
      console.log(
        `✅ Unchanged selection for metaId ${metaId}: ${newSelection.subject.name}`,
      );
      unchangedSelections.push(currentSelection);
    }
  }

  console.log(
    `📊 Summary: ${changedSelections.length} changed, ${unchangedSelections.length} unchanged`,
  );

  // If nothing changed, still trigger notification and return
  if (changedSelections.length === 0) {
    console.log("✅ No changes detected, returning current selections");
    console.log(
      "[backend] Starting notification enqueueing for no-change scenario",
    );
    try {
      const [student] = await db
        .select({ userId: studentModel.userId })
        .from(studentModel)
        .where(eq(studentModel.id, studentId))
        .limit(1);

      console.log("[backend] Student lookup result (no-change):", {
        student,
        hasUserId: !!student?.userId,
      });

      // derive academic year name from any current selection
      let academicYearName = "";
      if (currentSelections.length > 0) {
        const dto = await modelToDto(
          currentSelections[0] as StudentSubjectSelectionT,
        );
        academicYearName = String(
          (dto.subjectSelectionMeta as any)?.academicYear?.name || "",
        );
      }

      if (student?.userId) {
        const masterId = await getNotificationMasterIdByName(
          "Subject Selection Confirmation",
        );
        console.log("[backend] enqueue subject-selection (no-change) ->", {
          userId: student.userId,
          masterId,
          academicYearName,
        });

        // Build rowsForGrid from current selections for no-change scenario
        const rowsForGrid = await Promise.all(
          currentSelections.map(async (selection) => {
            const dto = await modelToDto(selection as StudentSubjectSelectionT);
            return {
              metaLabel: (dto.subjectSelectionMeta as any)?.label || "",
              subjectName: dto.subject?.name || "",
            };
          }),
        );

        // Build per-field content rows from notification master meta
        let contentRows: Array<{ whatsappFieldId: number; content: string }> =
          [];
        if (masterId) {
          const { notificationMasterMetaModel } = await import(
            "@repo/db/schemas/models/notifications/notification-master-meta.model"
          );
          const { notificationMasterFieldModel } = await import(
            "@repo/db/schemas/models/notifications/notification-master-field.model"
          );

          console.log(
            "[backend] notification master ID (no-change):",
            masterId,
          );

          const metas = await db
            .select({
              fieldId: notificationMasterMetaModel.notificationMasterFieldId,
              sequence: notificationMasterMetaModel.sequence,
              flag: notificationMasterMetaModel.flag,
            })
            .from(notificationMasterMetaModel)
            .where(
              eq(notificationMasterMetaModel.notificationMasterId, masterId),
            );
          const activeMetas = metas
            .filter((m) => m.flag === true)
            .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

          console.log(
            "[backend] notification master metas (no-change):",
            JSON.stringify(activeMetas, null, 2),
          );

          const fieldIds = activeMetas.map((m) => m.fieldId as number);
          if (fieldIds.length > 0) {
            const fields = await db
              .select({
                id: notificationMasterFieldModel.id,
                name: notificationMasterFieldModel.name,
              })
              .from(notificationMasterFieldModel)
              .where(inArray(notificationMasterFieldModel.id, fieldIds));

            console.log(
              "[backend] notification master fields (no-change):",
              JSON.stringify(fields, null, 2),
            );

            const nameById = new Map(
              fields.map((f) => [f.id as number, String(f.name)]),
            );

            console.log(
              "[backend] subject selection meta labels from rowsForGrid (no-change):",
              JSON.stringify(rowsForGrid, null, 2),
            );

            // Build values: academicYear and each selection label -> selected subject name
            const normalize = (s: string) =>
              String(s || "")
                .normalize("NFKD")
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "");
            const labelToValue: Record<string, string> = {};

            // Get student name for Name field
            const [studentUser] = await db
              .select({ name: userModel.name })
              .from(studentModel)
              .leftJoin(userModel, eq(studentModel.userId, userModel.id))
              .where(eq(studentModel.id, studentId))
              .limit(1);

            console.log("[backend] Student user lookup (no-change):", {
              studentId,
              studentUser,
              studentName: studentUser?.name,
            });

            // Support common key variants for academic year
            labelToValue[normalize("academicYear")] = academicYearName;
            labelToValue[normalize("Academic Year")] = academicYearName;
            labelToValue[normalize("Name")] = studentUser?.name || "Student";
            labelToValue[normalize("Student Name")] =
              studentUser?.name || "Student";
            for (const r of rowsForGrid) {
              labelToValue[normalize(r.metaLabel)] = r.subjectName;
            }

            console.log(
              "[backend] normalized labelToValue mapping (no-change):",
              JSON.stringify(labelToValue, null, 2),
            );

            const resolveValueForField = (rawName: string) => {
              const key = normalize(rawName);
              let value = labelToValue[key];
              if (value) return value;

              console.log(
                `[backend] Field mapping attempt (no-change): "${rawName}" -> normalized: "${key}"`,
              );
              console.log(
                `[backend] Available keys (no-change):`,
                Object.keys(labelToValue),
              );

              // Handle combined semester labels like "Semester III & IV"
              if (/SEMESTERIIIIV/.test(key)) {
                // Try specific semester variants
                const variantA = key.replace("SEMESTERIIIIV", "SEMESTERIII");
                const variantB = key.replace("SEMESTERIIIIV", "SEMESTERIV");
                value = labelToValue[variantA] || labelToValue[variantB] || "";
                console.log(
                  `[backend] Combined semester mapping (no-change): ${key} -> ${variantA}/${variantB} -> "${value}"`,
                );
                return value;
              }
              // Alternative tokenization: sometimes master label may be "III&IV" without 'SEMESTER'
              if (/IIIIV/.test(key) && !/SEMESTER/.test(key)) {
                const variantA = key.replace("IIIIV", "III");
                const variantB = key.replace("IIIIV", "IV");
                value = labelToValue[variantA] || labelToValue[variantB] || "";
                console.log(
                  `[backend] Alternative semester mapping (no-change): ${key} -> ${variantA}/${variantB} -> "${value}"`,
                );
                return value;
              }

              // Try partial matching for common field names
              const partialMatches = Object.keys(labelToValue).filter(
                (k) => k.includes(key) || key.includes(k),
              );
              if (partialMatches.length > 0) {
                value = labelToValue[partialMatches[0]];
                console.log(
                  `[backend] Partial match found (no-change): ${key} -> ${partialMatches[0]} -> "${value}"`,
                );
                return value;
              }

              console.log(
                `[backend] No match found for (no-change): "${rawName}" (normalized: "${key}")`,
              );
              return "";
            };

            // Only include fields that have actual values (not empty or fallback values)
            contentRows = activeMetas
              .map((m) => {
                const rawName = nameById.get(m.fieldId as number) || "";
                let value = resolveValueForField(rawName);

                console.log(
                  `[backend] Field mapping attempt (no-change): rawName="${rawName}", initial value="${value}"`,
                );

                // Only apply fallback for Name and Academic Year fields
                if (!value || value.trim() === "") {
                  if (rawName.toLowerCase().includes("name")) {
                    value = studentUser?.name || "Student";
                  } else if (
                    rawName.toLowerCase().includes("academic") ||
                    rawName.toLowerCase().includes("year")
                  ) {
                    value = academicYearName || "2024-25";
                  }
                  // Don't apply fallbacks for subject fields - only include if student actually selected them
                }

                console.log(
                  `[backend] Final field mapping (no-change): rawName="${rawName}" -> value="${value}"`,
                );

                return {
                  whatsappFieldId: m.fieldId as number,
                  content: String(value ?? ""),
                  rawName: rawName,
                  hasValue:
                    value &&
                    value.trim() !== "" &&
                    !value.includes("Subject Selection Pending") &&
                    !value.includes("IDC Subject") &&
                    !value.includes("AEC Subject") &&
                    !value.includes("CVAC Subject"),
                };
              })
              .filter(
                (row) =>
                  row.hasValue ||
                  row.rawName.toLowerCase().includes("name") ||
                  row.rawName.toLowerCase().includes("academic") ||
                  row.rawName.toLowerCase().includes("year"),
              ) // Always include Name and Academic Year
              .map((row) => ({
                whatsappFieldId: row.whatsappFieldId,
                content: row.content,
              }));

            console.log(
              "[backend] final contentRows (no-change):",
              JSON.stringify(contentRows, null, 2),
            );
            console.log(
              "[backend] contentRows length (no-change):",
              contentRows.length,
            );
          }
        }

        // Get student's stream information for no-change scenario
        const streamInfo = await getStudentStreamInfo(studentId);
        const streamName = streamInfo?.streamName || "BA"; // Default fallback

        console.log("[backend] Student stream info (no-change):", {
          studentId,
          streamName,
        });

        // Get notification master IDs for both EMAIL and WHATSAPP
        const emailMasterName = getNotificationMasterNameByStream(
          streamName,
          "EMAIL",
        );
        const whatsappMasterName = getNotificationMasterNameByStream(
          streamName,
          "WHATSAPP",
        );

        const [emailMasterId, whatsappMasterId] = await Promise.all([
          getNotificationMasterIdByName(emailMasterName),
          getNotificationMasterIdByName(whatsappMasterName),
        ]);

        // Filter contentRows for email based on stream
        let emailContentRows = contentRows;
        if (
          streamName === "BSC" ||
          streamName === "Science" ||
          whatsappMasterName === "Subject Selection Confirmation - BSC"
        ) {
          // For BSC students, exclude "Minor 3" field from email content
          emailContentRows = contentRows.filter((row, index) => index !== 3); // Remove index 3 (Minor 3)
          console.log(
            "[backend] BSC email (no-change): Filtered out Minor 3 field, using",
            emailContentRows.length,
            "content rows",
          );
        }

        // Enqueue EMAIL notification
        await enqueueNotification({
          userId: student.userId as number,
          variant: "EMAIL",
          type: "INFO",
          message: "Confirmation of Semester-wise Subject Selection",
          notificationMasterId: emailMasterId,
          notificationEvent: {
            subject: "Confirmation of Semester-wise Subject Selection",
            templateData: { academicYear: academicYearName },
            meta: { devOnly: true },
          },
          content: emailContentRows,
        });

        // Enqueue WHATSAPP notification with stream-specific master
        await enqueueNotification({
          userId: student.userId as number,
          variant: "WHATSAPP",
          type: "INFO",
          message: "Subject Selection Confirmation",
          notificationMasterId: whatsappMasterId,
          notificationEvent: {
            notificationMaster: { id: whatsappMasterId } as any,
            bodyValues: contentRows.map((row) => row.content),
            meta: { devOnly: true },
          } as any,
          content: contentRows,
        });

        console.log("[backend] enqueue subject-selection (no-change) <- done");
      }
    } catch (err) {
      console.log("[Notif] enqueue failed (no-change):", err);
    }
    return { success: true, data: unchangedSelections };
  }

  // Enrich only the changed selections
  const enrichedChangedSelections = await Promise.all(
    changedSelections.map(async (selection) => {
      const [meta] = await db
        .select()
        .from(subjectSelectionMetaModel)
        .where(
          eq(subjectSelectionMetaModel.id, selection.subjectSelectionMeta.id),
        );

      if (!meta) {
        throw new Error(
          `Meta not found for ID: ${selection.subjectSelectionMeta.id}`,
        );
      }

      const [subjectType] = await db
        .select()
        .from(subjectTypeModel)
        .where(eq(subjectTypeModel.id, meta.subjectTypeId));

      const classes = await db
        .select({
          class: {
            id: classModel.id,
            name: classModel.name,
          },
        })
        .from(subjectSelectionMetaClassModel)
        .leftJoin(
          classModel,
          eq(subjectSelectionMetaClassModel.classId, classModel.id),
        )
        .where(
          eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, meta.id),
        );

      return {
        ...selection,
        subjectSelectionMeta: {
          id: meta.id,
          label: meta.label,
          subjectTypeId: meta.subjectTypeId,
          academicYearId: meta.academicYearId,
          subjectType: subjectType || null,
          forClasses: classes.map((c) => c.class).filter(Boolean),
        },
      };
    }),
  );

  // Enrich unchanged selections for validation
  const enrichedUnchangedSelections = await Promise.all(
    unchangedSelections.map(async (selection) => {
      const [meta] = await db
        .select()
        .from(subjectSelectionMetaModel)
        .where(
          eq(subjectSelectionMetaModel.id, selection.subjectSelectionMetaId),
        );

      if (!meta) {
        throw new Error(
          `Meta not found for ID: ${selection.subjectSelectionMetaId}`,
        );
      }

      const [subjectType] = await db
        .select()
        .from(subjectTypeModel)
        .where(eq(subjectTypeModel.id, meta.subjectTypeId));

      const [subject] = await db
        .select()
        .from(subjectModel)
        .where(eq(subjectModel.id, selection.subjectId));

      const classes = await db
        .select({
          class: {
            id: classModel.id,
            name: classModel.name,
          },
        })
        .from(subjectSelectionMetaClassModel)
        .leftJoin(
          classModel,
          eq(subjectSelectionMetaClassModel.classId, classModel.id),
        )
        .where(
          eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, meta.id),
        );

      return {
        studentId: selection.studentId,
        session: { id: selection.sessionId },
        subjectSelectionMeta: {
          id: meta.id,
          label: meta.label,
          subjectTypeId: meta.subjectTypeId,
          academicYearId: meta.academicYearId,
          subjectType: subjectType || null,
          forClasses: classes.map((c) => c.class).filter(Boolean),
        },
        subject: {
          id: selection.subjectId,
          name: subject?.name || "",
        },
      };
    }),
  );

  // Validate ALL selections (changed + unchanged) to ensure completeness
  const allSelectionsForValidation = [
    ...enrichedChangedSelections,
    ...enrichedUnchangedSelections,
  ];

  const validationErrors = await validateStudentSubjectSelections(
    studentId,
    allSelectionsForValidation,
  );

  if (validationErrors.length > 0) {
    return { success: false, errors: validationErrors };
  }

  // Process changes: deprecate old and create new with proper parent relationships
  const newSelections: StudentSubjectSelection[] = [];
  const deprecatedIds: number[] = [];

  for (const changedSelection of enrichedChangedSelections) {
    const metaId = changedSelection.subjectSelectionMeta.id;
    const currentSelection = currentSelectionsMap.get(metaId);
    const originalSelection = originalSelectionsMap.get(metaId);

    if (currentSelection && currentSelection.id) {
      // Mark current selection as deprecated
      await db
        .update(studentSubjectSelectionModel)
        .set({
          isDeprecated: true,
          isActive: false,
        })
        .where(eq(studentSubjectSelectionModel.id, currentSelection.id));

      deprecatedIds.push(currentSelection.id);
      console.log(
        `🗑️ Deprecated selection ID ${currentSelection.id} for metaId ${metaId}`,
      );
    }

    // Calculate next version number
    const nextVersion = currentSelection
      ? (currentSelection.version || 1) + 1
      : 1;

    // Parent ID should always point to the original/first entry for this metaId
    const parentId = originalSelection ? originalSelection.id : null;

    // Create new selection with parent relationship pointing to original
    const newSelection: StudentSubjectSelection = {
      studentId: changedSelection.studentId,
      sessionId: changedSelection.session.id,
      subjectSelectionMetaId: changedSelection.subjectSelectionMeta.id,
      subjectId: changedSelection.subject.id,
      version: nextVersion,
      parentId: parentId, // Always point to the original/first entry
      isDeprecated: false,
      isActive: true,
      createdBy: createdBy || null,
      changeReason: changeReason || "Admin update",
    } as StudentSubjectSelection;

    newSelections.push(newSelection);
    console.log(
      `✨ Created new selection for metaId ${metaId} with parentId ${parentId || "null"} (original) and version ${nextVersion}`,
    );
  }

  // Insert new selections
  const insertedSelections = await db
    .insert(studentSubjectSelectionModel)
    .values(newSelections)
    .returning();

  console.log(
    `✅ Successfully inserted ${insertedSelections.length} new selections`,
  );

  // Return all active selections (unchanged + newly inserted)
  const allActiveSelections = [...unchangedSelections, ...insertedSelections];

  // Enqueue updated confirmation notifications (email and WhatsApp) - non-blocking
  try {
    const [student] = await db
      .select({ userId: studentModel.userId })
      .from(studentModel)
      .where(eq(studentModel.id, studentId))
      .limit(1);

    if (student?.userId) {
      // Get student's stream information
      const streamInfo = await getStudentStreamInfo(studentId);
      const streamName = streamInfo?.streamName || "BA"; // Default fallback

      console.log("[backend] Student stream info (update):", {
        studentId,
        streamName,
      });

      const dtos = await Promise.all(
        allActiveSelections.map((selection) =>
          modelToDto(selection as StudentSubjectSelectionT),
        ),
      );
      const rowsForGrid = dtos.map((d) => ({
        metaLabel: (d.subjectSelectionMeta as any)?.label || "",
        subjectName: d.subject?.name || "",
      }));
      const academicYearName = String(
        (dtos[0]?.subjectSelectionMeta as any)?.academicYear?.name || "",
      );

      // Get notification master IDs for both EMAIL and WHATSAPP
      const emailMasterName = getNotificationMasterNameByStream(
        streamName,
        "EMAIL",
      );
      const whatsappMasterName = getNotificationMasterNameByStream(
        streamName,
        "WHATSAPP",
      );

      const [emailMasterId, whatsappMasterId] = await Promise.all([
        getNotificationMasterIdByName(emailMasterName),
        getNotificationMasterIdByName(whatsappMasterName),
      ]);

      console.log("[backend] enqueue subject-selection (update) ->", {
        userId: student.userId,
        streamName,
        emailMasterName,
        whatsappMasterName,
        emailMasterId,
        whatsappMasterId,
        academicYearName,
      });

      // Build per-field content rows from notification master meta
      let contentRows: Array<{ whatsappFieldId: number; content: string }> = [];
      if (emailMasterId) {
        const { notificationMasterMetaModel } = await import(
          "@repo/db/schemas/models/notifications/notification-master-meta.model"
        );
        const { notificationMasterFieldModel } = await import(
          "@repo/db/schemas/models/notifications/notification-master-field.model"
        );

        const metas = await db
          .select({
            fieldId: notificationMasterMetaModel.notificationMasterFieldId,
            sequence: notificationMasterMetaModel.sequence,
            flag: notificationMasterMetaModel.flag,
          })
          .from(notificationMasterMetaModel)
          .where(
            eq(notificationMasterMetaModel.notificationMasterId, emailMasterId),
          );
        console.log(
          "[backend] Raw metas query result:",
          JSON.stringify(metas, null, 2),
        );
        const activeMetas = metas
          .filter((m) => m.flag === true)
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

        const fieldIds = activeMetas.map((m) => m.fieldId as number);
        if (fieldIds.length > 0) {
          const fields = await db
            .select({
              id: notificationMasterFieldModel.id,
              name: notificationMasterFieldModel.name,
            })
            .from(notificationMasterFieldModel)
            .where(inArray(notificationMasterFieldModel.id, fieldIds));

          const nameById = new Map(
            fields.map((f) => [f.id as number, String(f.name)]),
          );

          // Build values: academicYear and each selection label -> selected subject name
          const normalize = (s: string) =>
            String(s || "")
              .normalize("NFKD")
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "");
          const labelToValue: Record<string, string> = {};
          // Support common key variants for academic year
          labelToValue[normalize("academicYear")] = academicYearName;
          labelToValue[normalize("Academic Year")] = academicYearName;
          for (const r of rowsForGrid) {
            labelToValue[normalize(r.metaLabel)] = r.subjectName;
          }

          console.log("[backend] DEBUG: Field mapping analysis (changed):", {
            rowsForGrid: rowsForGrid.map((r) => ({
              metaLabel: r.metaLabel,
              subjectName: r.subjectName,
            })),
            notificationMasterFields: fields.map((f) => ({
              id: f.id,
              name: f.name,
            })),
            activeMetas: activeMetas.map((m) => ({
              fieldId: m.fieldId,
              sequence: m.sequence,
            })),
          });

          const resolveValueForField = (rawName: string) => {
            const key = normalize(rawName);
            let value = labelToValue[key];
            if (value) return value;
            // Handle combined semester labels like "Semester III & IV"
            if (/SEMESTERIIIIV/.test(key)) {
              // Try specific semester variants
              const variantA = key.replace("SEMESTERIIIIV", "SEMESTERIII");
              const variantB = key.replace("SEMESTERIIIIV", "SEMESTERIV");
              value = labelToValue[variantA] || labelToValue[variantB] || "";
              return value;
            }
            // Alternative tokenization: sometimes master label may be "III&IV" without 'SEMESTER'
            if (/IIIIV/.test(key) && !/SEMESTER/.test(key)) {
              const variantA = key.replace("IIIIV", "III");
              const variantB = key.replace("IIIIV", "IV");
              value = labelToValue[variantA] || labelToValue[variantB] || "";
              return value;
            }
            return "";
          };

          // Only include fields that have actual values (not empty or fallback values)
          contentRows = activeMetas
            .map((m) => {
              const rawName = nameById.get(m.fieldId as number) || "";
              const value = resolveValueForField(rawName);
              return {
                whatsappFieldId: m.fieldId as number,
                content: String(value ?? ""),
                rawName: rawName,
                hasValue:
                  value &&
                  value.trim() !== "" &&
                  !value.includes("Subject Selection Pending") &&
                  !value.includes("IDC Subject") &&
                  !value.includes("AEC Subject") &&
                  !value.includes("CVAC Subject"),
              };
            })
            .filter((row) => row.hasValue || row.rawName === "Name") // Always include Name field
            .map((row) => ({
              whatsappFieldId: row.whatsappFieldId,
              content: row.content,
            }));
        }
      }

      // Filter contentRows for email based on stream
      let emailContentRows = contentRows;
      if (
        streamName === "BSC" ||
        streamName === "Science" ||
        whatsappMasterName === "Subject Selection Confirmation - BSC"
      ) {
        // For BSC students, exclude "Minor 3" field from email content
        emailContentRows = contentRows.filter((row, index) => index !== 3); // Remove index 3 (Minor 3)
        console.log(
          "[backend] BSC email (changed): Filtered out Minor 3 field, using",
          emailContentRows.length,
          "content rows",
        );
      }

      // Enqueue EMAIL notification
      await enqueueNotification({
        userId: student.userId as number,
        variant: "EMAIL",
        type: "INFO",
        message: "Confirmation of Semester-wise Subject Selection",
        notificationMasterId: emailMasterId,
        notificationEvent: {
          subject: "Confirmation of Semester-wise Subject Selection",
          templateData: {
            academicYear: academicYearName,
          },
          meta: { devOnly: true },
        },
        content: emailContentRows,
      });

      // Enqueue WHATSAPP notification with stream-specific master
      await enqueueNotification({
        userId: student.userId as number,
        variant: "WHATSAPP",
        type: "INFO",
        message: "Subject Selection Confirmation",
        notificationMasterId: whatsappMasterId,
        notificationEvent: {
          notificationMaster: { id: whatsappMasterId } as any,
          bodyValues: contentRows.map((row) => row.content),
          meta: { devOnly: true },
        } as any,
        content: contentRows,
      });

      console.log("[backend] enqueue subject-selection (update) <- done");
    }
  } catch (err) {
    console.log("[Notif] enqueue failed (update):", err);
  }

  // Emit MIS table updates via socket
  const affectedStudentIds = Array.from(
    new Set(selections.map((s) => s.studentId)),
  );
  await emitMisTableUpdates(affectedStudentIds);

  return {
    success: true,
    data: allActiveSelections,
  };
}

// Debug function to check Minor 3 creation conditions
export async function debugMinor3Conditions() {
  console.log("=== DEBUGGING MINOR 3 CONDITIONS ===");

  // Check academic year
  const academicYear = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.year, "2025-26"));
  console.log(
    "Academic Year 2025-26:",
    academicYear[0] ? "EXISTS" : "NOT FOUND",
  );

  // Check streams
  const streams = await db.select().from(streamModel);
  const commerceStream = streams.find(
    (s) => s.name.toLowerCase().trim() === "commerce",
  );
  console.log(
    "Commerce Stream:",
    commerceStream ? `EXISTS (ID: ${commerceStream.id})` : "NOT FOUND",
  );
  console.log(
    "All Streams:",
    streams.map((s) => s.name),
  );

  // Check classes
  const classes = await db.select().from(classModel);
  const semester3Class = classes.find(
    (c) => c.name.toUpperCase().trim() === "SEMESTER III",
  );
  console.log(
    "Semester III Class:",
    semester3Class ? `EXISTS (ID: ${semester3Class.id})` : "NOT FOUND",
  );
  console.log(
    "All Classes:",
    classes.map((c) => c.name),
  );

  // Check subject types
  const subjectTypes = await db.select().from(subjectTypeModel);
  const minorSubjectType = subjectTypes.find(
    (st) => st.code?.toUpperCase().trim() === "MN",
  );
  console.log(
    "Minor Subject Type:",
    minorSubjectType
      ? `EXISTS (ID: ${minorSubjectType.id}, Code: ${minorSubjectType.code})`
      : "NOT FOUND",
  );
  console.log(
    "All Subject Types:",
    subjectTypes.map((st) => `${st.name} (${st.code})`),
  );

  // Check if Minor 3 meta exists
  if (academicYear[0] && minorSubjectType) {
    const minor3Meta = await db
      .select()
      .from(subjectSelectionMetaModel)
      .where(
        and(
          eq(subjectSelectionMetaModel.label, "Minor 3 (Semester III)"),
          eq(subjectSelectionMetaModel.subjectTypeId, minorSubjectType.id),
          eq(subjectSelectionMetaModel.academicYearId, academicYear[0].id),
        ),
      );
    console.log(
      "Minor 3 Meta:",
      minor3Meta[0] ? `EXISTS (ID: ${minor3Meta[0].id})` : "NOT FOUND",
    );
  }

  console.log("=== END DEBUG ===");
}

// Export function for student subject selections
export async function exportStudentSubjectSelections(
  subjectSelectionMetaId: number,
  userId?: string,
) {
  console.log(
    `Starting export for subject selection meta ID: ${subjectSelectionMetaId}`,
  );

  // Send initial progress update
  if (userId) {
    const progressUpdate = socketService.createExportProgressUpdate(
      userId,
      "Starting export process...",
      0,
      "started",
    );
    socketService.sendProgressUpdate(userId, progressUpdate);
  }

  // Get the academic year from the provided meta ID (used as reference to get academic year)
  const referenceMeta = await db
    .select({
      id: subjectSelectionMetaModel.id,
      label: subjectSelectionMetaModel.label,
      subjectTypeId: subjectSelectionMetaModel.subjectTypeId,
      academicYearId: subjectSelectionMetaModel.academicYearId,
    })
    .from(subjectSelectionMetaModel)
    .where(eq(subjectSelectionMetaModel.id, subjectSelectionMetaId))
    .limit(1);

  if (referenceMeta.length === 0) {
    return {
      buffer: null,
      fileName: `student_subject_selections_${subjectSelectionMetaId}_not_found.xlsx`,
      totalRecords: 0,
      error: `Subject selection meta with ID ${subjectSelectionMetaId} not found`,
    };
  }

  const academicYearId = referenceMeta[0].academicYearId;

  // Send progress update - fetching metadata
  if (userId) {
    const progressUpdate = socketService.createExportProgressUpdate(
      userId,
      "Fetching subject selection metadata...",
      10,
      "in_progress",
    );
    socketService.sendProgressUpdate(userId, progressUpdate);
  }

  // Get all subject selection meta labels for the academic year to include as columns
  let allMetasForYear = await db
    .select({
      id: subjectSelectionMetaModel.id,
      label: subjectSelectionMetaModel.label,
      sequence: subjectSelectionMetaModel.sequence,
    })
    .from(subjectSelectionMetaModel)
    .where(eq(subjectSelectionMetaModel.academicYearId, academicYearId));

  // Debug: Log all metas found for the academic year
  console.log(
    `Found ${allMetasForYear.length} metas for academic year ${academicYearId}:`,
  );
  allMetasForYear.forEach((m) => {
    console.log(`- ID: ${m.id}, Label: "${m.label}", Sequence: ${m.sequence}`);
  });

  // Sort by sequence (nulls last), to ensure consistent column order after Section
  allMetasForYear = allMetasForYear.sort((a, b) => {
    const av = a.sequence ?? Number.MAX_SAFE_INTEGER;
    const bv = b.sequence ?? Number.MAX_SAFE_INTEGER;
    return av - bv;
  });

  // Get latest version of student subject selections for ALL metas in the academic year (per student+subject)
  // This ensures we get all students who have selections for any meta in the academic year
  const latestSelections = await db
    .select({
      studentId: studentSubjectSelectionModel.studentId,
      subjectId: studentSubjectSelectionModel.subjectId,
      version: max(studentSubjectSelectionModel.version),
      createdAt: max(studentSubjectSelectionModel.createdAt),
      updatedAt: max(studentSubjectSelectionModel.updatedAt),
    })
    .from(studentSubjectSelectionModel)
    .where(
      and(
        inArray(
          studentSubjectSelectionModel.subjectSelectionMetaId,
          allMetasForYear.map((m) => m.id),
        ),
        eq(studentSubjectSelectionModel.isActive, true),
      ),
    )
    .groupBy(
      studentSubjectSelectionModel.studentId,
      studentSubjectSelectionModel.subjectId,
    );

  if (latestSelections.length === 0) {
    console.log(
      "No student subject selections found for any meta in the academic year",
    );
    return {
      buffer: null, // Let controller handle empty file creation
      fileName: `student_subject_selections_academic_year_${academicYearId}_empty.xlsx`,
      totalRecords: 0,
      allMetasForYear: allMetasForYear, // Include meta information for consistent column structure
    };
  }

  // Send progress update - fetching student data
  if (userId) {
    const progressUpdate = socketService.createExportProgressUpdate(
      userId,
      `Fetching student data for ${latestSelections.length} selections...`,
      30,
      "in_progress",
    );
    socketService.sendProgressUpdate(userId, progressUpdate);
  }

  // Get student IDs for batch fetching
  const studentIds = [...new Set(latestSelections.map((s) => s.studentId))];
  console.log(
    `Found ${studentIds.length} unique students with selections:`,
    studentIds,
  );

  // Get student details with user info and promotions
  const studentsWithDetails = await db
    .select({
      studentId: studentModel.id,
      uid: studentModel.uid,
      studentClassRoll: studentModel.classRollNumber,
      userId: studentModel.userId,
      userName: userModel.name,
      userType: userModel.type,
      promotionId: promotionModel.id,
      rollNumber: promotionModel.rollNumber,
      sectionId: promotionModel.sectionId,
      sectionName: sectionModel.name,
      sessionId: promotionModel.sessionId,
      sessionName: sessionModel.name,
      programCourseName: programCourseModel.name,
    })
    .from(studentModel)
    .innerJoin(userModel, eq(studentModel.userId, userModel.id))
    .leftJoin(promotionModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(sectionModel, eq(promotionModel.sectionId, sectionModel.id))
    .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
    .leftJoin(
      programCourseModel,
      eq(promotionModel.programCourseId, programCourseModel.id),
    )
    .where(inArray(studentModel.id, studentIds));

  // We'll compute subjectIds after loading allSelectionsForYear
  // we'll declare 'subjects' after we have subjectIds computed
  let subjects: { id: number; name: string; code: string | null }[] = [];

  // Get user details for createdBy (collect from raw rows per student in meta later); initialize empty map for now
  const createdByUsers = await db
    .select({
      id: userModel.id,
      name: userModel.name,
      type: userModel.type,
    })
    .from(userModel)
    .where(sql`1=0`); // placeholder empty selection; we'll look up createdBy users dynamically below

  // Create lookup maps (subjectMap will be created later after subjects are loaded)
  const studentMap = new Map(studentsWithDetails.map((s) => [s.studentId, s]));
  const userMap = new Map<number, { id: number; name: string; type: string }>(
    createdByUsers.map((u) => [u.id, u]),
  );

  // Get all student subject selections for all metas in the academic year
  const allSelectionsForYear = await db
    .select({
      studentId: studentSubjectSelectionModel.studentId,
      subjectSelectionMetaId:
        studentSubjectSelectionModel.subjectSelectionMetaId,
      subjectId: studentSubjectSelectionModel.subjectId,
      subjectName: subjectModel.name,
      version: max(studentSubjectSelectionModel.version),
      createdAt: max(studentSubjectSelectionModel.createdAt),
      updatedAt: max(studentSubjectSelectionModel.updatedAt),
    })
    .from(studentSubjectSelectionModel)
    .leftJoin(
      subjectModel,
      eq(studentSubjectSelectionModel.subjectId, subjectModel.id),
    )
    .where(
      and(
        inArray(
          studentSubjectSelectionModel.subjectSelectionMetaId,
          allMetasForYear.map((m) => m.id),
        ),
        eq(studentSubjectSelectionModel.isActive, true),
      ),
    )
    .groupBy(
      studentSubjectSelectionModel.studentId,
      studentSubjectSelectionModel.subjectSelectionMetaId,
      studentSubjectSelectionModel.subjectId,
      subjectModel.name,
    );

  // Now that we have all selections across metas, compute subject ids and build maps
  const subjectIds = [
    ...new Set(allSelectionsForYear.map((s: any) => s.subjectId)),
  ];
  if (subjectIds.length > 0) {
    subjects = await db
      .select({
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
      })
      .from(subjectModel)
      .where(inArray(subjectModel.id, subjectIds));
  }

  // Now create the subjectMap after subjects are loaded
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Debug: Log subject mapping info
  console.log(
    `Loaded ${subjects.length} subjects for mapping:`,
    subjects.map((s) => `${s.name} (ID: ${s.id})`),
  );

  // Group selections by student and meta (each entry is the latest per student+meta+subject)
  const studentSelectionsMap = new Map();
  allSelectionsForYear.forEach((selection) => {
    const key = `${selection.studentId}_${selection.subjectSelectionMetaId}`;
    if (!studentSelectionsMap.has(key)) {
      studentSelectionsMap.set(key, []);
    }
    studentSelectionsMap.get(key).push(selection);
  });

  // Debug: Log total selections found
  console.log(`Total selections found: ${allSelectionsForYear.length}`);
  console.log(`Student selections map size: ${studentSelectionsMap.size}`);

  // Debug: Log selections breakdown by meta
  const selectionsByMeta = new Map();
  allSelectionsForYear.forEach((selection) => {
    const metaId = selection.subjectSelectionMetaId;
    const meta = allMetasForYear.find((m) => m.id === metaId);
    const metaLabel = meta ? meta.label : `Meta ID ${metaId}`;
    selectionsByMeta.set(metaLabel, (selectionsByMeta.get(metaLabel) || 0) + 1);
  });
  console.log("Selections by meta:", Object.fromEntries(selectionsByMeta));

  // Prepare Excel data
  const excelData = [];

  for (const studentDetail of studentsWithDetails) {
    const row: any = {
      UID: studentDetail.uid || "",
      Name: studentDetail.userName || "",
      Session: studentDetail.sessionName || "",
      "Program-Course": studentDetail.programCourseName || "",
      "Class Roll No.":
        studentDetail.studentClassRoll || studentDetail.rollNumber || "",
      Section: studentDetail.sectionName || "",
    };

    // Add columns for each subject selection meta
    for (const metaItem of allMetasForYear) {
      const key = `${studentDetail.studentId}_${metaItem.id}`;
      const selections = studentSelectionsMap.get(key) || [];

      if (selections.length > 0) {
        // Choose the latest selection prioritizing version, then updatedAt, then createdAt
        const latestSel = selections.reduce((acc: any, cur: any) => {
          const accVer = typeof acc.version === "number" ? acc.version : -1;
          const curVer = typeof cur.version === "number" ? cur.version : -1;
          if (curVer !== accVer) {
            return curVer > accVer ? cur : acc;
          }
          const accTime = acc.updatedAt || acc.createdAt || 0;
          const curTime = cur.updatedAt || cur.createdAt || 0;
          return curTime >= accTime ? cur : acc;
        });

        const pickedName = (() => {
          if (latestSel.subjectName) return latestSel.subjectName as string;
          const subj = subjectMap.get(latestSel.subjectId);
          return subj ? subj.name : "";
        })();

        row[metaItem.label] = pickedName;

        // Debug: Log when Minor 3 has data
        if (metaItem.label.includes("Minor 3") && pickedName) {
          console.log(
            `Minor 3 latest subject for student ${studentDetail.uid}:`,
            pickedName,
          );
        }
      } else {
        row[metaItem.label] = "";
      }
    }

    // Find the latest audit info for this student across all metas of this academic year
    // This fulfills the requirement: last updated should be the latest among ALL student-subject-selection rows
    const studentRowsForMeta = await db
      .select({
        id: studentSubjectSelectionModel.id,
        studentId: studentSubjectSelectionModel.studentId,
        updatedAt: studentSubjectSelectionModel.updatedAt,
        createdBy: studentSubjectSelectionModel.createdBy,
        changeReason: studentSubjectSelectionModel.changeReason,
      })
      .from(studentSubjectSelectionModel)
      .where(
        and(
          inArray(
            studentSubjectSelectionModel.subjectSelectionMetaId,
            allMetasForYear.map((m) => m.id),
          ),
          eq(studentSubjectSelectionModel.studentId, studentDetail.studentId),
        ),
      )
      .orderBy(
        desc(studentSubjectSelectionModel.updatedAt),
        desc(studentSubjectSelectionModel.id),
      );

    // Pick the very latest row (sorted desc by updatedAt, id)
    const latestAudit = studentRowsForMeta[0];
    if (latestAudit) {
      if (!userMap.has(latestAudit.createdBy)) {
        const [u] = await db
          .select({
            id: userModel.id,
            name: userModel.name,
            type: userModel.type,
          })
          .from(userModel)
          .where(eq(userModel.id, latestAudit.createdBy));
        if (u) userMap.set(u.id, u);
      }
      const createdByUser = userMap.get(latestAudit.createdBy);
      row["Last updated by user type"] =
        createdByUser?.type?.toString().toUpperCase() || "";
      const lastUpdated = latestAudit.updatedAt || null;
      row["Last Updated"] = lastUpdated
        ? new Date(lastUpdated).toLocaleString()
        : "";

      // Aggregate all non-empty remarks for the student in this meta (deduped, latest first)
      const remarks = studentRowsForMeta
        .map((r) => r.changeReason)
        .filter((v): v is string => Boolean(v && v.trim())) as string[];
      const uniqueRemarks: string[] = [];
      for (const r of remarks) {
        if (!uniqueRemarks.includes(r)) uniqueRemarks.push(r);
      }
      row["Remarks"] = uniqueRemarks.join(" | ");

      // Latest updated by user name
      row["By User Name"] = createdByUser ? createdByUser.name : "";
    } else {
      row["Last updated by user type"] = "";
      row["Last Updated"] = "";
      row["Remarks"] = "";
      row["By User Name"] = "";
    }

    excelData.push(row);
  }

  // Send progress update - generating Excel file
  if (userId) {
    const progressUpdate = socketService.createExportProgressUpdate(
      userId,
      `Generating Excel file with ${excelData.length} records...`,
      80,
      "in_progress",
    );
    socketService.sendProgressUpdate(userId, progressUpdate);
  }

  // Generate Excel file
  const wb = XLSX.utils.book_new();

  // Set column widths
  const colWidths = [
    { wch: 15 }, // UID
    { wch: 30 }, // Name
    { wch: 28 }, // Program-Course
    { wch: 15 }, // Class Roll No.
    { wch: 20 }, // Session
    { wch: 15 }, // Section
  ];

  // Add widths for subject selection meta columns
  allMetasForYear.forEach(() => {
    colWidths.push({ wch: 25 });
  });

  // Add widths for remaining columns
  colWidths.push(
    { wch: 18 }, // Last updated by user type
    { wch: 20 }, // Last Updated
    { wch: 30 }, // Remarks
    { wch: 25 }, // By User Name
  );

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, "Student Subject Selections");

  // Generate buffer
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `student_subject_selections_academic_year_${academicYearId}_${timestamp}.xlsx`;

  console.log(`Export completed. Total records: ${excelData.length}`);

  // Send final progress update - completed
  if (userId) {
    const progressUpdate = socketService.createExportProgressUpdate(
      userId,
      `Export completed successfully! Generated ${excelData.length} records.`,
      100,
      "completed",
      fileName,
    );
    socketService.sendProgressUpdate(userId, progressUpdate);
  }

  return {
    buffer,
    fileName,
    totalRecords: excelData.length,
    allMetasForYear: allMetasForYear, // Include meta information for consistency
  };
}

// Live counts by Program-Course for an academic year
export async function getLiveSelectionCountsByProgramCourse(
  academicYearId: number,
) {
  const metas = await db
    .select({ id: subjectSelectionMetaModel.id })
    .from(subjectSelectionMetaModel)
    .where(eq(subjectSelectionMetaModel.academicYearId, academicYearId));
  const metaIds = metas.map((m) => m.id);

  if (metaIds.length === 0) {
    return { updatedAt: new Date().toISOString(), programCourses: [] };
  }

  const doneRows = await db
    .select({
      programCourseId: promotionModel.programCourseId,
      doneCount:
        sql<number>`COUNT(DISTINCT ${studentSubjectSelectionModel.studentId})`.as(
          "doneCount",
        ),
    })
    .from(studentSubjectSelectionModel)
    .innerJoin(
      studentModel,
      eq(studentModel.id, studentSubjectSelectionModel.studentId),
    )
    .leftJoin(promotionModel, eq(promotionModel.studentId, studentModel.id))
    .where(
      and(
        inArray(studentSubjectSelectionModel.subjectSelectionMetaId, metaIds),
        eq(studentSubjectSelectionModel.isActive, true),
      ),
    )
    .groupBy(promotionModel.programCourseId);

  const eligibleRows = await db
    .select({
      programCourseId: promotionModel.programCourseId,
      eligibleCount: sql<number>`COUNT(DISTINCT ${studentModel.id})`.as(
        "eligibleCount",
      ),
    })
    .from(studentModel)
    .leftJoin(promotionModel, eq(promotionModel.studentId, studentModel.id))
    .groupBy(promotionModel.programCourseId);

  const pcIds = [
    ...new Set(
      [...doneRows, ...eligibleRows]
        .map((r: any) => r.programCourseId)
        .filter(Boolean),
    ),
  ];
  const pcs = pcIds.length
    ? await db
        .select({ id: programCourseModel.id, name: programCourseModel.name })
        .from(programCourseModel)
        .where(inArray(programCourseModel.id, pcIds))
    : [];
  const pcMap = new Map(pcs.map((p) => [p.id, p.name]));

  const eligibleMap = new Map(
    eligibleRows.map((r: any) => [r.programCourseId, r.eligibleCount]),
  );
  const doneMap = new Map(
    doneRows.map((r: any) => [r.programCourseId, r.doneCount]),
  );
  const programCourses = pcIds.map((id) => {
    const eligible = eligibleMap.get(id) || 0;
    const done = doneMap.get(id) || 0;
    const name = pcMap.get(id) || String(id);
    const percent = eligible > 0 ? Math.round((done / eligible) * 100) : 0;
    return {
      programCourseId: id,
      name,
      doneCount: done,
      eligibleCount: eligible,
      percent,
    };
  });

  return { updatedAt: new Date().toISOString(), programCourses };
}

// Helper function to emit MIS table updates via socket
async function emitMisTableUpdates(studentIds: number[]) {
  try {
    // Get unique session and class combinations for the affected students
    const studentPromotions = await db
      .select({
        sessionId: promotionModel.sessionId,
        classId: promotionModel.classId,
      })
      .from(promotionModel)
      .where(inArray(promotionModel.studentId, studentIds));

    // Get unique combinations
    const uniqueCombinations = Array.from(
      new Set(
        studentPromotions.map(
          (p) => `${p.sessionId || "null"}-${p.classId || "null"}`,
        ),
      ),
    );

    // Emit updates for each unique combination
    for (const combination of uniqueCombinations) {
      const [sessionIdStr, classIdStr] = combination.split("-");
      const sessionId =
        sessionIdStr === "null" ? undefined : parseInt(sessionIdStr);
      const classId = classIdStr === "null" ? undefined : parseInt(classIdStr);

      const misData = await getMisTableData(sessionId, classId);
      socketService.sendMisTableUpdate({ sessionId, classId }, misData.data, {
        trigger: "subject_selection_change",
        affectedStudents: studentIds.length,
      });
    }

    // Also emit a general update to all MIS dashboard clients
    const generalMisData = await getMisTableData();
    socketService.sendMisTableUpdateToAll(generalMisData.data, {
      trigger: "subject_selection_change",
      affectedStudents: studentIds.length,
    });

    console.log(
      `[SocketService] Emitted MIS table updates for ${studentIds.length} affected students`,
    );
  } catch (error) {
    console.error("[SocketService] Error emitting MIS table updates:", error);
  }
}

// MIS Table data with sessionId and classId filters
export async function getMisTableData(sessionId?: number, classId?: number) {
  // Build WHERE conditions for session and class filters
  const whereConditions = [
    eq(userModel.isActive, true),
    eq(userModel.type, "STUDENT"),
  ];

  if (sessionId) {
    whereConditions.push(eq(promotionModel.sessionId, sessionId));
  }

  if (classId) {
    whereConditions.push(eq(promotionModel.classId, classId));
  }

  // Get program course data with counts
  const programCourseData = await db
    .select({
      programCourseId: programCourseModel.id,
      programCourseName: programCourseModel.name,
      admitted: countDistinct(userModel.id),
      subjectSelectionDone: sql<number>`COUNT(DISTINCT CASE WHEN ${studentSubjectSelectionModel.studentId} IS NOT NULL THEN ${studentModel.id} END)`,
      onlineRegDone: sql<number>`COUNT(DISTINCT CASE WHEN ${cuRegistrationCorrectionRequestModel.onlineRegistrationDone} = true THEN ${studentModel.id} END)`,
      physicalRegDone: sql<number>`COUNT(DISTINCT CASE WHEN ${cuRegistrationCorrectionRequestModel.physicalRegistrationDone} = true THEN ${studentModel.id} END)`,
    })
    .from(programCourseModel)
    .innerJoin(
      promotionModel,
      eq(promotionModel.programCourseId, programCourseModel.id),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      studentSubjectSelectionModel,
      eq(studentSubjectSelectionModel.studentId, studentModel.id),
    )
    .leftJoin(
      cuRegistrationCorrectionRequestModel,
      eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
    )
    .where(and(...whereConditions))
    .groupBy(programCourseModel.id, programCourseModel.name);

  // Get total counts
  const totalData = await db
    .select({
      admitted: countDistinct(userModel.id),
      subjectSelectionDone: sql<number>`COUNT(DISTINCT CASE WHEN ${studentSubjectSelectionModel.studentId} IS NOT NULL THEN ${studentModel.id} END)`,
      onlineRegDone: sql<number>`COUNT(DISTINCT CASE WHEN ${cuRegistrationCorrectionRequestModel.onlineRegistrationDone} = true THEN ${studentModel.id} END)`,
      physicalRegDone: sql<number>`COUNT(DISTINCT CASE WHEN ${cuRegistrationCorrectionRequestModel.physicalRegistrationDone} = true THEN ${studentModel.id} END)`,
    })
    .from(programCourseModel)
    .innerJoin(
      promotionModel,
      eq(promotionModel.programCourseId, programCourseModel.id),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      studentSubjectSelectionModel,
      eq(studentSubjectSelectionModel.studentId, studentModel.id),
    )
    .leftJoin(
      cuRegistrationCorrectionRequestModel,
      eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
    )
    .where(and(...whereConditions));

  const total = totalData[0] || {
    admitted: 0,
    subjectSelectionDone: 0,
    onlineRegDone: 0,
    physicalRegDone: 0,
  };

  // Combine data with totals
  const data = [
    ...programCourseData.map((row, index) => ({
      programCourseName:
        row.programCourseName || `Program Course ${row.programCourseId}`,
      admitted: row.admitted,
      subjectSelectionDone: row.subjectSelectionDone,
      onlineRegDone: row.onlineRegDone,
      physicalRegDone: row.physicalRegDone,
      sortOrder: 0,
    })),
    {
      programCourseName: "Total",
      admitted: total.admitted,
      subjectSelectionDone: total.subjectSelectionDone,
      onlineRegDone: total.onlineRegDone,
      physicalRegDone: total.physicalRegDone,
      sortOrder: 1,
    },
  ];

  return {
    updatedAt: new Date().toISOString(),
    sessionId,
    classId,
    data,
  };
}
