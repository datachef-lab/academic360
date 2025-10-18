import { eq, and } from "drizzle-orm";
import {
  studentSubjectSelectionModel,
  subjectSelectionMetaModel,
} from "@repo/db/schemas/models/subject-selection";
import {
  paperModel,
  subjectModel,
  subjectTypeModel,
} from "@repo/db/schemas/models/course-design";
import { studentModel } from "@repo/db/schemas/models/user";
import { db } from "@/db";
import { findSubjectsSelections } from "./student-subjects.service";

export interface DynamicSubjectCategory {
  id: number;
  name: string;
  code: string;
  sequence: number;
  semesters: {
    [semester: string]: {
      studentSelections: Array<{
        id: number;
        name: string;
        code: string;
        isMandatory: boolean;
      }>;
      mandatorySubjects: Array<{
        id: number;
        name: string;
        code: string;
      }>;
    };
  };
}

export interface DynamicSubjectsResponse {
  categories: DynamicSubjectCategory[];
  hasStudentSelections: boolean;
  totalSelections: number;
}

/**
 * Fetches dynamic subject data for a student including:
 * - All available subject categories (from subject types)
 * - Student's actual selections for each category/semester
 * - Mandatory subjects for each category/semester
 */
export async function getDynamicSubjectsForStudent(
  studentId: number,
): Promise<DynamicSubjectsResponse> {
  try {
    console.log(
      `[DYNAMIC-SUBJECTS] Fetching dynamic subjects for student ${studentId}`,
    );

    // First, get the student's program course to determine mandatory subjects
    const [student] = await db
      .select({
        id: studentModel.id,
        programCourseId: studentModel.programCourseId,
      })
      .from(studentModel)
      .where(eq(studentModel.id, studentId));

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Get all subject types (categories) that are active OR have mandatory papers
    const subjectTypes = await db
      .select({
        id: subjectTypeModel.id,
        name: subjectTypeModel.name,
        code: subjectTypeModel.code,
        sequence: subjectTypeModel.sequence,
      })
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.isActive, true))
      .orderBy(subjectTypeModel.sequence);

    // Get subject types from mandatory papers (even if inactive)
    const mandatorySubjectTypes = await db
      .select({
        id: subjectTypeModel.id,
        name: subjectTypeModel.name,
        code: subjectTypeModel.code,
        sequence: subjectTypeModel.sequence,
      })
      .from(subjectTypeModel)
      .innerJoin(paperModel, eq(subjectTypeModel.id, paperModel.subjectTypeId))
      .where(
        and(
          eq(paperModel.programCourseId, student.programCourseId),
          eq(paperModel.isActive, true),
          eq(paperModel.isOptional, false), // Mandatory papers
        ),
      )
      .groupBy(
        subjectTypeModel.id,
        subjectTypeModel.name,
        subjectTypeModel.code,
        subjectTypeModel.sequence,
      );

    // Get subject types from student selections (even if inactive)
    const studentSelectionSubjectTypes = await db
      .select({
        id: subjectTypeModel.id,
        name: subjectTypeModel.name,
        code: subjectTypeModel.code,
        sequence: subjectTypeModel.sequence,
      })
      .from(subjectTypeModel)
      .innerJoin(
        subjectSelectionMetaModel,
        eq(subjectTypeModel.id, subjectSelectionMetaModel.subjectTypeId),
      )
      .innerJoin(
        studentSubjectSelectionModel,
        eq(
          subjectSelectionMetaModel.id,
          studentSubjectSelectionModel.subjectSelectionMetaId,
        ),
      )
      .where(
        and(
          eq(studentSubjectSelectionModel.studentId, studentId),
          eq(studentSubjectSelectionModel.isActive, true),
        ),
      )
      .groupBy(
        subjectTypeModel.id,
        subjectTypeModel.name,
        subjectTypeModel.code,
        subjectTypeModel.sequence,
      );

    // Combine active subject types with mandatory paper subject types and student selection subject types
    const allSubjectTypes = [...subjectTypes];
    [...mandatorySubjectTypes, ...studentSelectionSubjectTypes].forEach(
      (type) => {
        if (!allSubjectTypes.find((st) => st.id === type.id)) {
          allSubjectTypes.push(type);
        }
      },
    );

    console.log(
      `[DYNAMIC-SUBJECTS] Found ${subjectTypes.length} active subject types`,
    );
    console.log(
      `[DYNAMIC-SUBJECTS] Found ${mandatorySubjectTypes.length} mandatory paper subject types`,
    );
    console.log(
      `[DYNAMIC-SUBJECTS] Found ${studentSelectionSubjectTypes.length} student selection subject types`,
    );
    console.log(
      `[DYNAMIC-SUBJECTS] Total subject types: ${allSubjectTypes.length}`,
    );
    console.log(
      `[DYNAMIC-SUBJECTS] Subject types:`,
      allSubjectTypes.map((st) => ({
        id: st.id,
        name: st.name,
        code: st.code,
        sequence: st.sequence,
      })),
    );

    // Get student's subject selections using the student-subjects service
    const subjectsData = await findSubjectsSelections(studentId);
    console.log(
      `[DYNAMIC-SUBJECTS] Subjects data from findSubjectsSelections:`,
      {
        hasFormSubmissions: subjectsData.hasFormSubmissions,
        actualStudentSelections: subjectsData.actualStudentSelections.length,
        studentSubjectsSelection: subjectsData.studentSubjectsSelection.length,
        studentSubjectsSelectionDetails:
          subjectsData.studentSubjectsSelection.map((g) => ({
            subjectTypeName: g.subjectType?.name,
            subjectTypeId: g.subjectType?.id,
            paperOptionsCount: g.paperOptions?.length || 0,
            paperOptions: g.paperOptions?.map((p) => ({
              id: p.id,
              name: p.name,
              subjectName: p.subject?.name,
              className: p.class?.name,
            })),
          })),
      },
    );

    // Process the studentSubjectsSelection data to extract student selections
    // This data comes from the admission data and contains the student's subject selections
    const studentSelections: any[] = [];

    // Process each subject type group from the admission data
    subjectsData.studentSubjectsSelection.forEach((group) => {
      const subjectType = group.subjectType;
      const paperOptions = group.paperOptions;

      // For each paper option, create a student selection entry
      paperOptions.forEach((paper) => {
        if (paper.subject?.name) {
          // Extract semester information from class name
          const semesterInfo = extractSemesterFromClassName(
            paper.class?.name || "",
          );
          const categoryName = determineCategoryName(
            subjectType?.name || "",
            semesterInfo,
          );

          studentSelections.push({
            id: `admission-${paper.id || Math.random()}`, // Generate ID for admission data
            subjectId: paper.subject.id,
            subjectSelectionMetaId: null, // Will be determined by subject type
            sessionId: null,
            subject: {
              id: paper.subject.id,
              name: paper.subject.name,
              code: paper.subject.code,
            },
            subjectSelectionMeta: {
              id: null,
              label: `${categoryName} - ${paper.class?.name || ""}`,
              subjectTypeId: subjectType?.id,
            },
          });
        }
      });
    });

    console.log(
      `[DYNAMIC-SUBJECTS] Processed ${studentSelections.length} student selections from admission data`,
    );

    console.log(
      `[DYNAMIC-SUBJECTS] Found ${studentSelections.length} student selections`,
    );
    console.log(
      `[DYNAMIC-SUBJECTS] Student selections:`,
      studentSelections.map((s) => ({
        id: s.id,
        subjectName: s.subject?.name,
        subjectTypeId: s.subjectSelectionMeta?.subjectTypeId,
        label: s.subjectSelectionMeta?.label,
        sessionId: s.sessionId,
      })),
    );

    // Check if student selections match any of the subject types we're processing
    const studentSelectionSubjectTypeIds = studentSelections
      .map((s) => s.subjectSelectionMeta?.subjectTypeId)
      .filter((id): id is number => id !== undefined);
    const processedSubjectTypeIds = allSubjectTypes.map((st) => st.id);
    console.log(
      `[DYNAMIC-SUBJECTS] Student selection subject type IDs:`,
      studentSelectionSubjectTypeIds,
    );
    console.log(
      `[DYNAMIC-SUBJECTS] Processed subject type IDs:`,
      processedSubjectTypeIds,
    );
    console.log(
      `[DYNAMIC-SUBJECTS] Matching subject types:`,
      studentSelectionSubjectTypeIds.filter((id) =>
        processedSubjectTypeIds.includes(id),
      ),
    );

    // Get mandatory papers for the student's program course
    const mandatoryPapers = await db
      .select({
        id: paperModel.id,
        name: paperModel.name,
        code: paperModel.code,
        subjectId: paperModel.subjectId,
        subjectTypeId: paperModel.subjectTypeId,
        subject: {
          id: subjectModel.id,
          name: subjectModel.name,
          code: subjectModel.code,
        },
        subjectType: {
          id: subjectTypeModel.id,
          name: subjectTypeModel.name,
          code: subjectTypeModel.code,
        },
      })
      .from(paperModel)
      .leftJoin(subjectModel, eq(paperModel.subjectId, subjectModel.id))
      .leftJoin(
        subjectTypeModel,
        eq(paperModel.subjectTypeId, subjectTypeModel.id),
      )
      .where(
        and(
          eq(paperModel.programCourseId, student.programCourseId),
          eq(paperModel.isActive, true),
        ),
      );

    console.log(
      `[DYNAMIC-SUBJECTS] Found ${mandatoryPapers.length} mandatory papers`,
    );
    console.log(
      `[DYNAMIC-SUBJECTS] Mandatory papers:`,
      mandatoryPapers.map((p) => ({
        id: p.id,
        name: p.name,
        subjectTypeId: p.subjectTypeId,
        subjectName: p.subject?.name,
      })),
    );

    // Create categories based on the new naming convention
    const categoryMap = new Map<string, DynamicSubjectCategory>();

    // Create unified categories - semester information is determined by the data
    const predefinedCategories = [
      { name: "minor", code: "MINOR" },
      { name: "idc", code: "IDC" },
      { name: "aec", code: "AEC" },
      { name: "cvac", code: "CVAC" },
      { name: "dscc", code: "DSCC" },
      { name: "sec", code: "SEC" },
    ];

    predefinedCategories.forEach((cat) => {
      categoryMap.set(cat.name, {
        id: Math.random(), // Generate unique ID
        name: cat.name,
        code: cat.code,
        sequence: 0,
        semesters: {
          sem1: { studentSelections: [], mandatorySubjects: [] },
          sem2: { studentSelections: [], mandatorySubjects: [] },
          sem3: { studentSelections: [], mandatorySubjects: [] },
          sem4: { studentSelections: [], mandatorySubjects: [] },
        },
      });
    });

    const categories: DynamicSubjectCategory[] = Array.from(
      categoryMap.values(),
    );

    // Add student selections to appropriate categories
    studentSelections.forEach((selection) => {
      const categoryName = extractCategoryNameFromLabel(
        selection.subjectSelectionMeta?.label || "",
      );
      const category = categoryMap.get(categoryName);

      if (category) {
        const semesters = determineSemestersFromMeta(
          selection.subjectSelectionMeta?.label || "",
        );

        semesters.forEach((sem) => {
          const semesterKey = `sem${sem}` as keyof typeof category.semesters;
          if (category.semesters[semesterKey]) {
            category.semesters[semesterKey].studentSelections.push({
              id: selection.id || 0,
              name: selection.subject?.name || "",
              code: selection.subject?.code || "",
              isMandatory: false, // Student selections are not mandatory
            });
          }
        });
      }
    });

    // Add mandatory subjects to appropriate categories
    mandatoryPapers.forEach((paper) => {
      const categoryName = determineCategoryNameFromPaper(paper.name);
      const category = categoryMap.get(categoryName);

      if (category) {
        const semesters = determineSemestersFromPaper(paper.name);

        semesters.forEach((sem) => {
          const semesterKey = `sem${sem}` as keyof typeof category.semesters;
          if (category.semesters[semesterKey]) {
            category.semesters[semesterKey].mandatorySubjects.push({
              id: paper.id,
              name: paper.subject?.name || paper.name,
              code: paper.subject?.code || paper.code,
            });
          }
        });
      }
    });

    // Remove duplicates from each semester in each category
    categories.forEach((category) => {
      Object.keys(category.semesters).forEach((semesterKey) => {
        const semester = category.semesters[semesterKey];

        // Deduplicate student selections by name
        const uniqueStudentSelections = semester.studentSelections.filter(
          (subject, index, self) =>
            index === self.findIndex((s) => s.name === subject.name),
        );
        semester.studentSelections = uniqueStudentSelections;

        // Deduplicate mandatory subjects by name
        const uniqueMandatorySubjects = semester.mandatorySubjects.filter(
          (subject, index, self) =>
            index === self.findIndex((s) => s.name === subject.name),
        );
        semester.mandatorySubjects = uniqueMandatorySubjects;
      });
    });

    const totalSelections = studentSelections.length;
    const hasStudentSelections = totalSelections > 0;

    console.log(
      `[DYNAMIC-SUBJECTS] Processed ${categories.length} categories with ${totalSelections} total selections`,
    );
    console.log(
      `[DYNAMIC-SUBJECTS] Final categories:`,
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        sequence: c.sequence,
        semesters: Object.keys(c.semesters).map((sem) => ({
          semester: sem,
          mandatoryCount: c.semesters[sem].mandatorySubjects.length,
          studentCount: c.semesters[sem].studentSelections.length,
        })),
      })),
    );

    return {
      categories,
      hasStudentSelections,
      totalSelections,
    };
  } catch (error) {
    console.error("[DYNAMIC-SUBJECTS] Error fetching dynamic subjects:", error);
    throw error;
  }
}

/**
 * Determines which semesters a subject selection meta applies to based on its label
 */
function determineSemestersFromMeta(label: string): number[] {
  const semesters: number[] = [];

  // Check for semester-specific patterns in labels
  if (/minor1|Minor\s*1/i.test(label)) semesters.push(1, 2);
  else if (/minor2|Minor\s*2/i.test(label)) semesters.push(3, 4);
  else if (/minor3|Minor\s*3/i.test(label)) semesters.push(3);
  else if (/minor/i.test(label)) {
    // General minor - spans all semesters
    semesters.push(1, 2, 3, 4);
  } else if (/idc1|IDC\s*1/i.test(label)) semesters.push(1);
  else if (/idc2|IDC\s*2/i.test(label)) semesters.push(2);
  else if (/idc3|IDC\s*3/i.test(label)) semesters.push(3);
  else if (/idc/i.test(label)) {
    // General IDC - spans semesters 1-3
    semesters.push(1, 2, 3);
  } else if (/aec3|AEC/i.test(label)) semesters.push(3, 4);
  else if (/aec/i.test(label)) semesters.push(3, 4);
  else if (/cvac2|CVAC/i.test(label)) semesters.push(2);
  else if (/cvac4/i.test(label)) semesters.push(4);
  else if (/cvac/i.test(label)) semesters.push(2, 4);
  else if (/dscc|DSCC/i.test(label)) {
    // DSCC typically spans all semesters
    semesters.push(1, 2, 3, 4);
  } else if (/sec|SEC/i.test(label)) {
    // SEC typically spans all semesters
    semesters.push(1, 2, 3, 4);
  }
  // Legacy patterns for backward compatibility
  else if (/Minor\s*1/i.test(label)) semesters.push(1, 2);
  else if (/Minor\s*2/i.test(label)) semesters.push(3, 4);
  else if (/Minor\s*3/i.test(label)) semesters.push(3);
  else if (/IDC\s*1/i.test(label)) semesters.push(1);
  else if (/IDC\s*2/i.test(label)) semesters.push(2);
  else if (/IDC\s*3/i.test(label)) semesters.push(3);
  else if (/AEC/i.test(label)) semesters.push(3, 4);
  else if (/CVAC/i.test(label)) semesters.push(2);
  else if (/DSCC/i.test(label)) {
    // DSCC typically spans all semesters
    semesters.push(1, 2, 3, 4);
  }
  // Additional patterns for better detection
  else if (/Semester\s*1|Sem\s*1|I\b/i.test(label)) semesters.push(1);
  else if (/Semester\s*2|Sem\s*2|II\b/i.test(label)) semesters.push(2);
  else if (/Semester\s*3|Sem\s*3|III\b/i.test(label)) semesters.push(3);
  else if (/Semester\s*4|Sem\s*4|IV\b/i.test(label)) semesters.push(4);

  // If no specific pattern found, try to extract from roman numerals
  const romanMatch = /\b(I|II|III|IV)\b/i.exec(label);
  if (romanMatch) {
    const romanMap: { [key: string]: number } = { I: 1, II: 2, III: 3, IV: 4 };
    semesters.push(romanMap[romanMatch[1].toUpperCase()]);
  }

  // If still no semesters found, don't default to all semesters to avoid duplication
  // Only add subjects to semesters where we can determine they belong
  if (semesters.length === 0) {
    console.log(
      `[DYNAMIC-SUBJECTS] No specific pattern found for "${label}", skipping semester assignment`,
    );
  }

  return semesters;
}

/**
 * Determines which semesters a mandatory paper applies to based on its name
 */
function determineSemestersFromPaper(paperName: string): number[] {
  const semesters: number[] = [];

  console.log(
    `[DYNAMIC-SUBJECTS] Determining semesters for paper: "${paperName}"`,
  );

  // Common patterns in paper names
  if (/Minor\s*1/i.test(paperName)) semesters.push(1, 2);
  else if (/Minor\s*2/i.test(paperName)) semesters.push(3, 4);
  else if (/Minor\s*3/i.test(paperName)) semesters.push(3);
  else if (/IDC\s*1/i.test(paperName)) semesters.push(1);
  else if (/IDC\s*2/i.test(paperName)) semesters.push(2);
  else if (/IDC\s*3/i.test(paperName)) semesters.push(3);
  else if (/AEC/i.test(paperName)) semesters.push(3, 4);
  else if (/CVAC/i.test(paperName)) semesters.push(2);
  else if (/DSCC/i.test(paperName)) {
    // DSCC typically spans all semesters
    semesters.push(1, 2, 3, 4);
  }
  // Additional patterns for better detection
  else if (/Semester\s*1|Sem\s*1|I\b/i.test(paperName)) semesters.push(1);
  else if (/Semester\s*2|Sem\s*2|II\b/i.test(paperName)) semesters.push(2);
  else if (/Semester\s*3|Sem\s*3|III\b/i.test(paperName)) semesters.push(3);
  else if (/Semester\s*4|Sem\s*4|IV\b/i.test(paperName)) semesters.push(4);

  // If no specific pattern found, try to extract from roman numerals
  const romanMatch = /\b(I|II|III|IV)\b/i.exec(paperName);
  if (romanMatch) {
    const romanMap: { [key: string]: number } = { I: 1, II: 2, III: 3, IV: 4 };
    semesters.push(romanMap[romanMatch[1].toUpperCase()]);
  }

  // If still no semesters found, don't default to all semesters to avoid duplication
  // Only add subjects to semesters where we can determine they belong
  if (semesters.length === 0) {
    console.log(
      `[DYNAMIC-SUBJECTS] No specific pattern found for "${paperName}", skipping semester assignment`,
    );
  }

  console.log(
    `[DYNAMIC-SUBJECTS] Assigned semesters for "${paperName}":`,
    semesters,
  );
  return semesters;
}

/**
 * Extracts semester information from class name
 */
function extractSemesterFromClassName(className: string): string {
  if (!className) return "";

  // Look for roman numerals in class name
  const romanMatch = /\b(I|II|III|IV)\b/i.exec(className);
  if (romanMatch) {
    return romanMatch[1].toUpperCase();
  }

  // Look for semester numbers
  const semesterMatch = /semester\s*(\d+)|sem\s*(\d+)/i.exec(className);
  if (semesterMatch) {
    const num = parseInt(semesterMatch[1] || semesterMatch[2]);
    const romanMap: { [key: number]: string } = {
      1: "I",
      2: "II",
      3: "III",
      4: "IV",
    };
    return romanMap[num] || "";
  }

  return "";
}

/**
 * Determines the category name based on subject type and semester information
 */
function determineCategoryName(
  subjectTypeName: string,
  semesterInfo: string,
): string {
  const subjectType = subjectTypeName.toLowerCase();

  // Minor subjects
  if (subjectType.includes("minor")) {
    if (semesterInfo === "I" || semesterInfo === "II") return "minor1";
    if (semesterInfo === "III" || semesterInfo === "IV") return "minor2";
    if (semesterInfo === "III") return "minor3";
    return "minor"; // fallback
  }

  // IDC subjects
  if (
    subjectType.includes("idc") ||
    subjectType.includes("interdisciplinary")
  ) {
    if (semesterInfo === "I") return "idc1";
    if (semesterInfo === "II") return "idc2";
    if (semesterInfo === "III") return "idc3";
    return "idc"; // fallback
  }

  // AEC subjects
  if (
    subjectType.includes("aec") ||
    subjectType.includes("ability enhancement")
  ) {
    if (semesterInfo === "III") return "aec3";
    return "aec"; // fallback
  }

  // CVAC subjects
  if (subjectType.includes("cvac") || subjectType.includes("common value")) {
    if (semesterInfo === "II") return "cvac2";
    if (semesterInfo === "IV") return "cvac4";
    return "cvac"; // fallback
  }

  // DSCC subjects
  if (
    subjectType.includes("dscc") ||
    subjectType.includes("discipline specific")
  ) {
    return "dscc";
  }

  // SEC subjects
  if (
    subjectType.includes("sec") ||
    subjectType.includes("skill enhancement")
  ) {
    return "sec";
  }

  // Default fallback
  return subjectTypeName.toLowerCase().replace(/\s+/g, "");
}

/**
 * Extracts category name from label
 */
function extractCategoryNameFromLabel(label: string): string {
  // Map all variants to unified categories
  if (/minor1|minor2|minor3|Minor\s*1|Minor\s*2|Minor\s*3|minor/i.test(label))
    return "minor";
  if (/idc1|idc2|idc3|IDC\s*1|IDC\s*2|IDC\s*3|idc/i.test(label)) return "idc";
  if (/aec3|AEC|aec/i.test(label)) return "aec";
  if (/cvac2|cvac4|CVAC|cvac/i.test(label)) return "cvac";
  if (/dscc|DSCC/i.test(label)) return "dscc";
  if (/sec|SEC/i.test(label)) return "sec";

  return "dscc"; // Default fallback
}

/**
 * Determines category name from paper name
 */
function determineCategoryNameFromPaper(paperName: string): string {
  const paper = paperName.toLowerCase();

  // Map all variants to unified categories
  if (/minor\s*1|minor\s*2|minor\s*3|minor/i.test(paper)) return "minor";
  if (/idc\s*1|idc\s*2|idc\s*3|idc/i.test(paper)) return "idc";
  if (/aec/i.test(paper)) return "aec";
  if (/cvac/i.test(paper)) return "cvac";
  if (/dscc/i.test(paper)) return "dscc";
  if (/sec/i.test(paper)) return "sec";

  return "dscc"; // Default fallback
}
