import type { Request } from "express";
import { parseReportExportFilters } from "@/utils/report-export-filters.js";
import type { GeneratedReport, ReportProgress } from "./report-job.service.js";
import {
  exportStudentDetailedReport,
  exportStudentAcademicSubjectsReport,
  downloadStudentImages,
} from "@/features/user/services/student.service.js";
import { exportEnrolmentMasterReportBuffer } from "@/features/user/services/enrolment-master-export.service.js";
import {
  exportStudentSubjectSelections,
  exportStudentSubjectsReport,
} from "@/features/subject-selection/services/student-subject-selection.service.js";
import { exportPromotionStudentsReport } from "@/features/academics/services/promotion.service.js";
import { exportCuRegistrationCorrectionRequests } from "@/features/admissions/services/cu-registration-correction-request.service.js";
import { downloadCuRegistrationDocumentsAsZip } from "@/features/admissions/services/cu-registration-document-upload.service.js";
import {
  buildExcelReport,
  streamZipForDate,
} from "@/features/idcard/services/id-card-report.service.js";
import {
  downloadFeeStructures,
  downloadFeeStudentMappings,
} from "@/features/fees/services/fee-structure.service.js";

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const ZIP = "application/zip";

/** Context handed to each generator: the request (for params) + progress cb. */
export interface GeneratorContext {
  req: Request;
  userId: string;
  onProgress: ReportProgress;
}

export interface ReportDescriptor {
  /** Stable key, matches the frontend report id. */
  key: string;
  label: string;
  generate: (ctx: GeneratorContext) => Promise<GeneratedReport>;
}

/* ------------------------------ param helpers ----------------------------- */

function num(req: Request, key: string): number | undefined {
  const raw = (req.query[key] ?? req.body?.[key] ?? req.params[key]) as
    | string
    | undefined;
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function str(req: Request, key: string): string | undefined {
  const raw = (req.query[key] ?? req.body?.[key] ?? req.params[key]) as
    | string
    | undefined;
  return raw == null || raw === "" ? undefined : String(raw);
}

function requireNum(req: Request, key: string): number {
  const n = num(req, key);
  if (n == null) throw new Error(`Missing or invalid "${key}"`);
  return n;
}

function filtersOf(req: Request) {
  return parseReportExportFilters(req.query as Record<string, unknown>);
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/* ------------------------------- registry --------------------------------- */

const DESCRIPTORS: ReportDescriptor[] = [
  {
    key: "student-detailed-report",
    label: "Student Detailed Report",
    generate: async ({ req }) => {
      const res = await exportStudentDetailedReport(
        requireNum(req, "academicYearId"),
        filtersOf(req),
      );
      return { buffer: res.buffer, fileName: res.fileName, contentType: XLSX };
    },
  },
  {
    key: "student-academic-subjects-report",
    label: "Student's 12th Subjects Report",
    generate: async ({ req }) => {
      const res = await exportStudentAcademicSubjectsReport(
        requireNum(req, "academicYearId"),
        filtersOf(req),
      );
      return { buffer: res.buffer, fileName: res.fileName, contentType: XLSX };
    },
  },
  {
    key: "student-images",
    label: "Student Avatar Images",
    generate: async ({ req, userId }) => {
      const academicYearId = requireNum(req, "academicYearId");
      // Pass a numeric userId only if it is numeric; the service uses it for its
      // own socket emits which the job's progress supersedes, so undefined is
      // fine (it guards on falsy userId).
      const numericUserId = Number(userId);
      const buffer = await downloadStudentImages(
        academicYearId,
        Number.isFinite(numericUserId) ? numericUserId : (undefined as never),
      );
      return {
        buffer,
        fileName: `student_avatar_images_${academicYearId}.zip`,
        contentType: ZIP,
      };
    },
  },
  {
    key: "subject-selection",
    label: "Subject Selection Report",
    generate: async ({ req }) => {
      // Frontend resolves the meta id for the year (unchanged) and passes it.
      const metaId = requireNum(req, "metaId");
      const res = await exportStudentSubjectSelections(
        metaId,
        undefined, // suppress the service's own userId-keyed socket emits
        filtersOf(req),
      );
      if (!res.buffer) {
        throw new Error(res.error || "No subject selection data to export");
      }
      return { buffer: res.buffer, fileName: res.fileName, contentType: XLSX };
    },
  },
  {
    key: "student-university-subjects-report",
    label: "Student University Subjects Report",
    generate: async ({ req }) => {
      const academicYearId = requireNum(req, "academicYearId");
      const buffer = await exportStudentSubjectsReport(
        academicYearId,
        filtersOf(req),
      );
      return {
        buffer,
        fileName: `student_university_subjects_${academicYearId}.xlsx`,
        contentType: XLSX,
      };
    },
  },
  {
    key: "enrolment-master-report",
    label: "Enrolment Master Report",
    generate: async ({ req }) => {
      const academicYearId = requireNum(req, "academicYearId");
      const buffer = await exportEnrolmentMasterReportBuffer(
        academicYearId,
        filtersOf(req),
      );
      return {
        buffer,
        fileName: `enrolment_master_${academicYearId}.xlsx`,
        contentType: XLSX,
      };
    },
  },
  {
    key: "cu-registration",
    label: "CU Registration Corrections Report",
    generate: async ({ req }) => {
      const academicYearId = requireNum(req, "academicYearId");
      const buffer = await exportCuRegistrationCorrectionRequests(
        academicYearId,
        filtersOf(req),
      );
      return {
        buffer,
        fileName: `cu_registration_corrections_${academicYearId}.xlsx`,
        contentType: XLSX,
      };
    },
  },
  {
    key: "cu-registration-pdfs",
    label: "CU Registration PDFs",
    generate: async ({ req }) => {
      const year = requireNum(req, "year");
      const regulationType = str(req, "regulationType") ?? "";
      const result = await downloadCuRegistrationDocumentsAsZip(
        year,
        regulationType,
        undefined, // no io: the job owns progress
        undefined,
        undefined,
        "pdfs",
      );
      return {
        buffer: result.pdfZipBuffer,
        fileName: `cu_registration_pdfs_${year}_${regulationType}.zip`,
        contentType: ZIP,
      };
    },
  },
  {
    key: "cu-registration-documents",
    label: "CU Registration Documents",
    generate: async ({ req }) => {
      const year = requireNum(req, "year");
      const regulationType = str(req, "regulationType") ?? "";
      const result = await downloadCuRegistrationDocumentsAsZip(
        year,
        regulationType,
        undefined,
        undefined,
        undefined,
        "documents",
      );
      return {
        buffer: result.documentsZipBuffer,
        fileName: `cu_registration_documents_${year}_${regulationType}.zip`,
        contentType: ZIP,
      };
    },
  },
  {
    key: "exam-form-submission-report",
    label: "Exam Form Submitted Report",
    generate: async ({ req }) => {
      const filters = filtersOf(req);
      const res = await exportPromotionStudentsReport({
        sessionId: num(req, "sessionId"),
        classId: num(req, "classId"),
        academicYearId: num(req, "academicYearId"),
        programCourseIds: filters.programCourseIds,
        affiliationIds: filters.affiliationIds,
        regulationTypeIds: filters.regulationTypeIds,
        classIds: filters.classIds,
      });
      return { buffer: res.buffer, fileName: res.fileName, contentType: XLSX };
    },
  },
  {
    key: "id-card-daily-excel",
    label: "ID Card Daily Excel Report",
    generate: async ({ req }) => {
      const date = str(req, "date") ?? "";
      const buffer = await buildExcelReport(date);
      return {
        buffer,
        fileName: `id_card_report_${date || "all"}.xlsx`,
        contentType: XLSX,
      };
    },
  },
  {
    key: "id-card-daily-zip",
    label: "ID Card Daily Images",
    generate: async ({ req }) => {
      const date = str(req, "date") ?? "";
      const stream = streamZipForDate(date);
      const buffer = await streamToBuffer(stream);
      return {
        buffer,
        fileName: `id_card_images_${date || "all"}.zip`,
        contentType: ZIP,
      };
    },
  },
  {
    key: "fee-structures",
    label: "Fee Structures",
    generate: async ({ req }) => {
      const academicYearId = requireNum(req, "academicYearId");
      const classId = num(req, "classId");
      const { buffer, academicYearYear } = await downloadFeeStructures(
        academicYearId,
        classId,
      );
      return {
        buffer,
        fileName: `fee_structures_${academicYearYear || academicYearId}.xlsx`,
        contentType: XLSX,
      };
    },
  },
  {
    key: "fee-student-mappings",
    label: "Fee Student Mapping & Payments",
    generate: async ({ req }) => {
      const academicYearId = requireNum(req, "academicYearId");
      const classId = num(req, "classId");
      const { buffer, academicYearYear } = await downloadFeeStudentMappings(
        academicYearId,
        classId,
      );
      return {
        buffer,
        fileName: `fee_student_mappings_${academicYearYear || academicYearId}.xlsx`,
        contentType: XLSX,
      };
    },
  },
];

const REGISTRY = new Map(DESCRIPTORS.map((d) => [d.key, d]));

export function getReportDescriptor(key: string): ReportDescriptor | undefined {
  return REGISTRY.get(key);
}

export function listReportKeys(): string[] {
  return [...REGISTRY.keys()];
}
