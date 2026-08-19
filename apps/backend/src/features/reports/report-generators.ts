import type { Request } from "express";
import { PassThrough } from "node:stream";
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
import {
  careerProgressionExportFileName,
  exportCareerProgressionFormsExcel,
} from "@/features/academics/services/career-progression-form-export.service.js";
import { exportDeclarationsReport } from "@/features/academics/services/declaration-export.service.js";
import { exportAdmitCardDistributionsReport } from "@/features/exams/services/admit-card.service.js";
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
import { parseLibraryReportFilters } from "@/features/library/services/report-common/library-report-filters.js";
import { exportBookCirculationExcel } from "@/features/library/services/report-excel/book-circulation-excel.service.js";
import { exportFinesExcel } from "@/features/library/services/report-excel/fines-excel.service.js";
import { exportStockSummaryExcel } from "@/features/library/services/report-excel/stock-summary-excel.service.js";
import { exportPopularBooksExcel } from "@/features/library/services/report-excel/popular-books-excel.service.js";
import { exportEntryExitExcel } from "@/features/library/services/report-excel/entry-exit-excel.service.js";
import { exportHoldingsExcel } from "@/features/library/services/report-excel/holdings-excel.service.js";
import { exportCopyDetailsReportExcel } from "@/features/library/services/report-excel/copy-details-excel.service.js";
import { exportPublicationsExcel } from "@/features/library/services/report-excel/publications-excel.service.js";
import { exportBookDemandForecastExcel } from "@/features/library/services/report-excel/book-demand-forecast-excel.service.js";
import { exportFootfallForecastExcel } from "@/features/library/services/report-excel/footfall-forecast-excel.service.js";
import {
  exportAisheExcel,
  exportNaacExcel,
  exportNirfExcel,
} from "@/features/library/services/report-excel/compliance-excel.service.js";

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

/**
 * A couple of exports (id-card daily excel, career progression) were
 * converted to stream straight to an HTTP response (see
 * idcard/services/id-card-report.service.ts and
 * academics/services/career-progression-form-export.service.ts) to stop
 * their live download endpoints from OOMing on a fully-buffered workbook.
 * This job queue's contract is a `Buffer` it stores/serves later, not a
 * live response — so here we hand those writers a `PassThrough` and collect
 * everything written to it into a `Buffer`, instead of duplicating a
 * buffered code path.
 */
async function collectStreamToBuffer(
  write: (stream: PassThrough) => Promise<void>,
): Promise<Buffer> {
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on("data", (chunk: Buffer) => chunks.push(chunk));
  const ended = new Promise<void>((resolve, reject) => {
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  await write(stream);
  await ended;
  return Buffer.concat(chunks);
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
    key: "admit-card-collection-report",
    label: "Admit Card Collection Report",
    generate: async ({ req }) => {
      const res = await exportAdmitCardDistributionsReport({
        ...filtersOf(req),
        academicYearId: num(req, "academicYearId"),
      });
      return { buffer: res.buffer, fileName: res.fileName, contentType: XLSX };
    },
  },
  {
    key: "career-progression-form-report",
    label: "Career Progression Form Report",
    generate: async ({ req, onProgress }) => {
      // academicYearId is optional here — the page allows "All years".
      const academicYearId = num(req, "academicYearId");
      const filters = filtersOf(req);
      const buffer = await collectStreamToBuffer((stream) =>
        exportCareerProgressionFormsExcel({
          academicYearId,
          filters,
          onProgress,
          res: stream,
        }).then(() => undefined),
      );
      const fileName = careerProgressionExportFileName(academicYearId);
      return { buffer, fileName, contentType: XLSX };
    },
  },
  {
    key: "declaration-report",
    label: "Declaration Report",
    generate: async ({ req, onProgress }) => {
      const res = await exportDeclarationsReport({
        academicYearId: num(req, "academicYearId"),
        context: str(req, "context"),
        declarationMasterId: num(req, "declarationMasterId"),
        filters: filtersOf(req),
        onProgress,
      });
      return { buffer: res.buffer, fileName: res.fileName, contentType: XLSX };
    },
  },
  {
    key: "id-card-daily-excel",
    label: "ID Card Daily Excel Report",
    generate: async ({ req }) => {
      const date = str(req, "date") ?? "";
      const buffer = await collectStreamToBuffer((stream) =>
        buildExcelReport(date, stream),
      );
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
  // ── Library reports ────────────────────────────────────────────────────
  // Each descriptor calls the corresponding exportXExcel service in
  // apps/backend/src/features/library/services/report-excel/ and returns the
  // ExcelJS buffer. The wide LibraryReportFilters set is parsed from
  // req.query by parseLibraryReportFilters (comma-separated ID lists).
  {
    key: "library-book-circulation",
    label: "Library — Book circulation",
    generate: async ({ req }) => ({
      buffer: await exportBookCirculationExcel(parseLibraryReportFilters(req)),
      fileName: `Library_Book_Circulation_${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: XLSX,
    }),
  },
  {
    key: "library-fines",
    label: "Library — Fines",
    generate: async ({ req }) => ({
      buffer: await exportFinesExcel(parseLibraryReportFilters(req)),
      fileName: `Library_Fines_${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: XLSX,
    }),
  },
  {
    key: "library-stock-summary",
    label: "Library — Stock summary",
    generate: async ({ req }) => ({
      buffer: await exportStockSummaryExcel(parseLibraryReportFilters(req)),
      fileName: `Library_Stock_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: XLSX,
    }),
  },
  {
    key: "library-popular-books",
    label: "Library — Popular / high-demand books",
    generate: async ({ req }) => ({
      buffer: await exportPopularBooksExcel(parseLibraryReportFilters(req)),
      fileName: `Library_Popular_Books_${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: XLSX,
    }),
  },
  {
    key: "library-entry-exit",
    label: "Library — Entry / Exit footfall",
    generate: async ({ req }) => ({
      buffer: await exportEntryExitExcel(parseLibraryReportFilters(req)),
      fileName: `Library_Entry_Exit_Footfall_${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: XLSX,
    }),
  },
  {
    key: "library-holdings",
    label: "Library — Books & copies (holdings)",
    generate: async ({ req }) => ({
      buffer: await exportHoldingsExcel(parseLibraryReportFilters(req)),
      fileName: `Library_Holdings_${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: XLSX,
    }),
  },
  {
    key: "library-copy-details",
    label: "Library — Copy details",
    generate: async ({ req, onProgress }) => ({
      buffer: await exportCopyDetailsReportExcel(
        parseLibraryReportFilters(req),
        onProgress,
      ),
      fileName: `Library_Copy_Details_${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: XLSX,
    }),
  },
  {
    key: "library-publications",
    label: "Library — Publications usage",
    generate: async ({ req }) => ({
      buffer: await exportPublicationsExcel(parseLibraryReportFilters(req)),
      fileName: `Library_Publications_Usage_${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: XLSX,
    }),
  },
  {
    key: "library-book-demand-forecast",
    label: "Library — Book demand estimate (next 30 days)",
    generate: async ({ req }) => ({
      buffer: await exportBookDemandForecastExcel(
        parseLibraryReportFilters(req),
      ),
      fileName: `Library_Book_Demand_Forecast_30d_${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: XLSX,
    }),
  },
  {
    key: "library-footfall-forecast",
    label: "Library — Footfall estimate (next 14 days)",
    generate: async ({ req }) => ({
      buffer: await exportFootfallForecastExcel(parseLibraryReportFilters(req)),
      fileName: `Library_Footfall_Forecast_14d_${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: XLSX,
    }),
  },
  {
    key: "library-naac",
    label: "Library — NAAC criterion 4.2",
    generate: async ({ req }) => {
      const year = str(req, "academicYear") || "";
      if (!year) throw new Error("Academic year is required");
      return {
        buffer: await exportNaacExcel(year),
        fileName: `Library_NAAC_${year}.xlsx`,
        contentType: XLSX,
      };
    },
  },
  {
    key: "library-nirf",
    label: "Library — NIRF library resources",
    generate: async ({ req }) => {
      const year = str(req, "academicYear") || "";
      if (!year) throw new Error("Academic year is required");
      return {
        buffer: await exportNirfExcel(year),
        fileName: `Library_NIRF_${year}.xlsx`,
        contentType: XLSX,
      };
    },
  },
  {
    key: "library-aishe",
    label: "Library — AISHE library figures",
    generate: async ({ req }) => {
      const year = str(req, "academicYear") || "";
      if (!year) throw new Error("Academic year is required");
      return {
        buffer: await exportAisheExcel(year),
        fileName: `Library_AISHE_${year}.xlsx`,
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
