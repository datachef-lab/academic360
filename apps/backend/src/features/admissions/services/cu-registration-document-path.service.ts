import { db } from "@/db/index.js";
import {
  promotionModel,
  sessionModel,
  academicYearModel,
  programCourseModel,
  regulationTypeModel,
} from "@repo/db/schemas";
import { eq } from "drizzle-orm";

/**
 * CU Registration Document Path Service
 *
 * This service is responsible for determining the correct folder structure
 * and file naming conventions for CU Registration documents.
 *
 * Folder Structure: /[Year]/[Course]/students/[UID]/admission-reg-form/[SubFolder]/
 * File Naming: [DocumentCode]-[CU_Reg_Number].jpg
 *
 * Example: /2025/CCF/students/0804250001/admission-reg-form/Marksheet/M-0170001.jpg
 *
 * Year and Course are fetched dynamically from:
 * - Year: promotions -> session -> academic_year
 * - Course: promotions -> program_course -> regulation_type (shortName)
 */

export interface CuRegDocumentPathConfig {
  folder: string;
  filename: string;
  fullPath: string;
  documentCode: string;
  cuRegNumber: string;
  studentUid: string;
  year: number;
  course: string;
}

/**
 * Document code to subfolder mapping based on Annexure 9
 */
const DOCUMENT_SUBFOLDER_MAP: Record<string, string> = {
  P: "Photo",
  S: "Signature",
  A: "Aadhaar", // Legacy mapping for "A" code
  AD: "Aadhaar", // Aadhaar card with AD prefix
  M: "Marksheet",
  C: "AdmissionForm",
  R: "AdmissionReceipt",
  AA: "AadhaarCard",
  ABC: "ABCID",
  FP: "ParentPhotoId",
  MP: "ParentPhotoId",
  EWS: "EwsCertificate",
  MC: "MigrationCertificate",
};

/**
 * Document name to document code mapping
 */
export const DOCUMENT_NAME_TO_CODE_MAP: Record<string, string> = {
  "Class XII Marksheet": "M",
  "Aadhaar Card": "AD",
  "APAAR ID Card": "ABC",
  "Father Photo ID": "FP",
  "Mother Photo ID": "MP",
  "EWS Certificate": "EWS",
  "Migration Certificate": "MC",
  // Additional mappings
  Photo: "P",
  Signature: "S",
  "Admission Form": "C",
  "Admission Receipt": "R",
};

/**
 * Fetch dynamic year and regulation data for a student
 * @param studentId - Student ID
 * @returns Object with year and regulation short name
 */
async function fetchStudentYearAndRegulation(studentId: number): Promise<{
  year: number;
  regulationShortName: string;
}> {
  try {
    // Fetch promotion data with related session, academic year, program course, and regulation type
    const [promotionData] = await db
      .select({
        academicYear: academicYearModel.year,
        regulationShortName: regulationTypeModel.shortName,
      })
      .from(promotionModel)
      .innerJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
      .innerJoin(
        academicYearModel,
        eq(sessionModel.academicYearId, academicYearModel.id),
      )
      .innerJoin(
        programCourseModel,
        eq(promotionModel.programCourseId, programCourseModel.id),
      )
      .innerJoin(
        regulationTypeModel,
        eq(programCourseModel.regulationTypeId, regulationTypeModel.id),
      )
      .where(eq(promotionModel.studentId, studentId))
      .limit(1);

    if (!promotionData) {
      throw new Error(`No promotion data found for student ID: ${studentId}`);
    }

    // Extract year from academic year string (e.g., "2025-2026" -> 2025)
    const yearMatch = promotionData.academicYear.match(/^(\d{4})/);
    const year = yearMatch
      ? parseInt(yearMatch[1], 10)
      : new Date().getFullYear();

    console.info(
      `[CU-REG DOC PATH] Fetched dynamic data for student ${studentId}:`,
      {
        academicYear: promotionData.academicYear,
        regulationShortName: promotionData.regulationShortName,
        extractedYear: year,
      },
    );

    return {
      year,
      regulationShortName: promotionData.regulationShortName || "CCF", // Default to CCF
    };
  } catch (error) {
    console.error(
      "[CU-REG DOC PATH] Error fetching student year and regulation:",
      error,
    );
    // Fallback to current year and CCF
    return {
      year: new Date().getFullYear(),
      regulationShortName: "CCF",
    };
  }
}

/**
 * Extract year from student UID
 * UID format: DDMMYYXXXX (e.g., 0804250001 -> 2025)
 */
function extractYearFromUid(studentUid: string): number {
  const yearPart = studentUid.substring(4, 6); // Extract YY
  return 2000 + parseInt(yearPart, 10); // Convert YY to YYYY
}

/**
 * Get document code from document name
 */
export function getDocumentCodeFromName(documentName: string): string {
  return DOCUMENT_NAME_TO_CODE_MAP[documentName] || "DOC";
}

/**
 * Get subfolder for a document code
 */
function getSubfolderForDocumentCode(documentCode: string): string {
  return DOCUMENT_SUBFOLDER_MAP[documentCode] || "Others";
}

/**
 * Generate complete path configuration for a CU Registration document (with dynamic data)
 *
 * @param studentId - Student ID
 * @param studentUid - Student UID (e.g., "0804250001")
 * @param cuRegNumber - CU Registration application number (e.g., "0170001")
 * @param documentCode - Document code (e.g., "M", "A", "ABC")
 * @param options - Optional overrides for year and course
 * @returns Path configuration object
 */
export async function getCuRegDocumentPathDynamic(
  studentId: number,
  studentUid: string,
  cuRegNumber: string,
  documentCode: string,
  options?: {
    year?: number;
    course?: string;
  },
): Promise<CuRegDocumentPathConfig> {
  let year: number;
  let course: string;

  if (options?.year && options?.course) {
    // Use provided values
    year = options.year;
    course = options.course;
  } else {
    // Fetch dynamic data from database
    const dynamicData = await fetchStudentYearAndRegulation(studentId);
    year = options?.year || dynamicData.year;
    course = options?.course || dynamicData.regulationShortName;
  }

  // Get subfolder based on document code
  const subfolder = getSubfolderForDocumentCode(documentCode);

  // Construct folder path: /[Year]/[Course]/adm-reg-docs/[SubFolder]
  // Documents are stored at regulation level, NOT per student
  const folder = `${year}/${course}/adm-reg-docs/${subfolder}`;

  // Construct filename: [DocumentCode][CU_Reg_Number].jpg (no hyphen)
  const filename = `${documentCode}${cuRegNumber}.jpg`;

  // Full path
  const fullPath = `${folder}/${filename}`;

  return {
    folder,
    filename,
    fullPath,
    documentCode,
    cuRegNumber,
    studentUid,
    year,
    course,
  };
}

/**
 * Generate complete path configuration for a CU Registration document (legacy function)
 *
 * @param studentUid - Student UID (e.g., "0804250001")
 * @param cuRegNumber - CU Registration application number (e.g., "0170001")
 * @param documentCode - Document code (e.g., "M", "A", "ABC")
 * @param options - Optional overrides for year and course
 * @returns Path configuration object
 */
export function getCuRegDocumentPath(
  studentUid: string,
  cuRegNumber: string,
  documentCode: string,
  options?: {
    year?: number;
    course?: string;
  },
): CuRegDocumentPathConfig {
  // Extract or use provided year
  const year = options?.year || extractYearFromUid(studentUid);

  // Default to CCF course if not provided
  const course = options?.course || "CCF";

  // Get subfolder based on document code
  const subfolder = getSubfolderForDocumentCode(documentCode);

  // Construct folder path: /[Year]/[Course]/adm-reg-docs/[SubFolder]
  // Documents are stored at regulation level, NOT per student
  const folder = `${year}/${course}/adm-reg-docs/${subfolder}`;

  // Construct filename: [DocumentCode][CU_Reg_Number].jpg (no hyphen)
  const filename = `${documentCode}${cuRegNumber}.jpg`;

  // Full path
  const fullPath = `${folder}/${filename}`;

  return {
    folder,
    filename,
    fullPath,
    documentCode,
    cuRegNumber,
    studentUid,
    year,
    course,
  };
}

/**
 * Generate path configuration from document name (with dynamic data)
 *
 * @param studentId - Student ID
 * @param studentUid - Student UID
 * @param cuRegNumber - CU Registration application number
 * @param documentName - Human-readable document name (e.g., "Class XII Marksheet")
 * @param options - Optional overrides
 * @returns Path configuration object
 */
export async function getCuRegDocumentPathFromNameDynamic(
  studentId: number,
  studentUid: string,
  cuRegNumber: string,
  documentName: string,
  options?: {
    year?: number;
    course?: string;
  },
): Promise<CuRegDocumentPathConfig> {
  const documentCode = getDocumentCodeFromName(documentName);
  return getCuRegDocumentPathDynamic(
    studentId,
    studentUid,
    cuRegNumber,
    documentCode,
    options,
  );
}

/**
 * Generate path configuration from document name (legacy function)
 *
 * @param studentUid - Student UID
 * @param cuRegNumber - CU Registration application number
 * @param documentName - Human-readable document name (e.g., "Class XII Marksheet")
 * @param options - Optional overrides
 * @returns Path configuration object
 */
export function getCuRegDocumentPathFromName(
  studentUid: string,
  cuRegNumber: string,
  documentName: string,
  options?: {
    year?: number;
    course?: string;
  },
): CuRegDocumentPathConfig {
  const documentCode = getDocumentCodeFromName(documentName);
  return getCuRegDocumentPath(studentUid, cuRegNumber, documentCode, options);
}

/**
 * Get base path for all CU registration documents (at regulation level, not per student)
 *
 * @param studentUid - Student UID (used to extract year)
 * @param options - Optional overrides
 * @returns Base folder path
 */
export function getCuRegBasePath(
  studentUid: string,
  options?: {
    year?: number;
    course?: string;
  },
): string {
  const year = options?.year || extractYearFromUid(studentUid);
  const course = options?.course || "CCF";

  return `${year}/${course}/adm-reg-docs`;
}

/**
 * Validate if a document code is valid
 */
export function isValidDocumentCode(documentCode: string): boolean {
  return documentCode in DOCUMENT_SUBFOLDER_MAP;
}

/**
 * Get all valid document codes
 */
export function getAllDocumentCodes(): string[] {
  return Object.keys(DOCUMENT_SUBFOLDER_MAP);
}

/**
 * Get all subfolders for CU Registration documents
 */
export function getAllCuRegSubfolders(): string[] {
  return Array.from(new Set(Object.values(DOCUMENT_SUBFOLDER_MAP)));
}

/**
 * Get path for the generated CU Registration PDF (with dynamic data)
 * Path format: /[Year]/[Course]/students/[UID]/adm-reg-forms/[CU_Reg_Number].pdf
 *
 * @param studentId - Student ID
 * @param studentUid - Student UID
 * @param cuRegNumber - CU Registration application number (e.g., "0170001")
 * @param options - Optional overrides
 * @returns Path configuration for the PDF
 */
export async function getCuRegPdfPathDynamic(
  studentId: number,
  studentUid: string,
  cuRegNumber: string,
  options?: {
    year?: number;
    course?: string;
  },
): Promise<{
  folder: string;
  filename: string;
  fullPath: string;
  cuRegNumber: string;
  studentUid: string;
  year: number;
  course: string;
}> {
  let year: number;
  let course: string;

  if (options?.year && options?.course) {
    // Use provided values
    year = options.year;
    course = options.course;
  } else {
    // Fetch dynamic data from database
    const dynamicData = await fetchStudentYearAndRegulation(studentId);
    year = options?.year || dynamicData.year;
    course = options?.course || dynamicData.regulationShortName;
  }

  // Construct folder path: /[Year]/[Course]/students/[UID]/adm-reg-forms
  const folder = `${year}/${course}/students/${studentUid}/adm-reg-forms`;

  // Construct filename: [CU_Reg_Number].pdf
  const filename = `${cuRegNumber}.pdf`;

  // Full path
  const fullPath = `${folder}/${filename}`;

  return {
    folder,
    filename,
    fullPath,
    cuRegNumber,
    studentUid,
    year,
    course,
  };
}

/**
 * Get path for the generated CU Registration PDF (legacy function)
 * Path format: /[Year]/[Course]/students/[UID]/adm-reg-forms/[CU_Reg_Number].pdf
 *
 * @param studentUid - Student UID
 * @param cuRegNumber - CU Registration application number (e.g., "0170001")
 * @param options - Optional overrides
 * @returns Path configuration for the PDF
 */
export function getCuRegPdfPath(
  studentUid: string,
  cuRegNumber: string,
  options?: {
    year?: number;
    course?: string;
  },
): {
  folder: string;
  filename: string;
  fullPath: string;
  cuRegNumber: string;
  studentUid: string;
  year: number;
  course: string;
} {
  // Extract or use provided year
  const year = options?.year || extractYearFromUid(studentUid);

  // Default to CCF course if not provided
  const course = options?.course || "CCF";

  // Construct folder path: /[Year]/[Course]/students/[UID]/adm-reg-forms
  const folder = `${year}/${course}/students/${studentUid}/adm-reg-forms`;

  // Construct filename: [CU_Reg_Number].pdf
  const filename = `${cuRegNumber}.pdf`;

  // Full path
  const fullPath = `${folder}/${filename}`;

  return {
    folder,
    filename,
    fullPath,
    cuRegNumber,
    studentUid,
    year,
    course,
  };
}
