import { db } from "@/db/index.js";
import { and, countDistinct, desc, eq, inArray } from "drizzle-orm";
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
} from "@repo/db/schemas/models/course-design";
import { academicYearModel } from "@repo/db/schemas/models/academics";
import { classModel } from "@repo/db/schemas/models/academics/class.model";
import { userModel } from "@repo/db/schemas/models/user";
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

export type CreateStudentSubjectSelectionDtoInput = {
  studentId: number;
  session: { id: number };
  subjectSelectionMeta: { id: number };
  subject: { id: number };
  // Versioning fields
  createdBy?: number; // User ID who created this (student/admin)
  changeReason?: string; // Reason for creation/change
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
  selections: StudentSubjectSelectionDto[],
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
  for (const selection of selections) {
    const subjectName = selection.subject?.name;
    const subjectTypeCode = selection.subjectSelectionMeta?.subjectType?.code;
    const category = categorizeSubject(subjectName || "", subjectTypeCode);

    // Extract semester from class name in the subject selection meta
    const semester = extractSemesterRoman(
      selection.subjectSelectionMeta?.forClasses?.[0]?.class?.name,
    );

    if (!subjectName) continue;

    switch (category) {
      case "MINOR":
        if (semester === "I" || semester === "II") {
          structuredSelections.minor1 = subjectName;
        } else if (semester === "III" || semester === "IV") {
          structuredSelections.minor2 = subjectName;
        }
        break;
      case "IDC":
        if (semester === "I") {
          structuredSelections.idc1 = subjectName;
        } else if (semester === "II") {
          structuredSelections.idc2 = subjectName;
        } else if (semester === "III") {
          structuredSelections.idc3 = subjectName;
        }
        break;
      case "AEC":
        if (semester === "III") {
          structuredSelections.aec3 = subjectName;
        }
        break;
      case "CVAC":
        if (semester === "II") {
          structuredSelections.cvac4 = subjectName;
        }
        break;
    }
  }

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

// Create multiple subject selections with validation (Student version - creates initial version)
export async function createStudentSubjectSelectionsWithValidation(
  selections: StudentSubjectSelectionDto[],
  createdBy?: number,
  changeReason?: string,
): Promise<{
  success: boolean;
  errors?: SubjectSelectionValidationError[];
  data?: StudentSubjectSelectionDto[];
}> {
  if (selections.length === 0) {
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

  if (existingSelections.length > 0) {
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

  // Validate the selections first
  const validationErrors = await validateStudentSubjectSelections(
    studentId,
    selections,
  );

  if (validationErrors.length > 0) {
    return { success: false, errors: validationErrors };
  }

  // Prepare data for insertion (Version 1 - Initial creation)
  const insertData: StudentSubjectSelection[] = [];

  for (const selection of selections) {
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
      changeReason: changeReason || "Initial student selection",
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
    // Find the corresponding current selection to get parentId
    const currentSelection = currentSelections.find(
      (cs) => cs.subjectSelectionMetaId === selection.subjectSelectionMeta.id,
    );

    insertData.push({
      studentId: selection.studentId,
      sessionId: selection.session.id,
      subjectSelectionMetaId: selection.subjectSelectionMeta.id,
      subjectId: selection.subject.id,
      version: nextVersion,
      parentId: currentSelection?.id || null, // Link to previous version
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

  // For now, fetch all subject selection metas for the current academic year
  // In a real implementation, you'd filter by student's academic year and program course
  const currentAcademicYear = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.year, "2025-26"))
    .limit(1);

  if (currentAcademicYear.length === 0) {
    return { subjectSelectionMetas: [], availableSubjects };
  }

  // Fetch subject selection metas for the current academic year
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
    .where(
      eq(subjectSelectionMetaModel.academicYearId, currentAcademicYear[0].id),
    );

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

  return {
    subjectSelectionMetas: fullDtos,
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
