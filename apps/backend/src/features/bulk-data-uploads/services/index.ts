import { db } from "@/db/index.js";
import { socketService } from "@/services/socketService.js";
import type {
  CuRegRollExcelUploadRow,
  ExamFormFillupExcelUploadRow,
} from "@repo/db/dtos";
import { updateStudentCuRollAndRegistration } from "@/features/user/services/student.service.js";
import { parseBulkExcelWithRequiredColumns } from "../utils/parse-bulk-upload-excel.js";
import { examFormFillupModel } from "@repo/db/schemas/models/exams/exam-form-fillup.model.js";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model.js";
import { promotionStatusModel } from "@repo/db/schemas/models/batches/promotion-status.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { sessionModel } from "@repo/db/schemas/models/academics/session.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

/**
 * Shared context for bulk Excel uploads (affiliation, regulation, academic year, class).
 * Extend this for each upload type that needs the same filters; add a `data` array or
 * pass file-derived rows in this module.
 */
export interface BulkUploadContextProps {
  affiliationId: number;
  regulationTypeId: number;
  academicYearId: number;
  classId: number;
  io?: unknown;
  uploadSessionId?: string;
}

/** Parsed Excel rows + shared {@link BulkUploadContextProps}. */
export interface BulkUploadExamFormFillupProps extends BulkUploadContextProps {
  data: ExamFormFillupExcelUploadRow[];
}

/** Header row labels expected in the first sheet of the exam form fillup Excel template. */
export const EXAM_FORM_FILLUP_EXCEL_COLUMNS = [
  "CU Reg Number",
  "CU Roll Number",
  "Appear Type",
  "Form Fill Up Status",
] as const;

/**
 * Reads the first worksheet of an `.xlsx` / `.xls` file and maps rows to
 * {@link ExamFormFillupExcelUploadRow}. The header row must use these exact column names.
 */
export function parseExamFormFillupExcelFile(
  filePath: string,
): ExamFormFillupExcelUploadRow[] {
  return parseBulkExcelWithRequiredColumns<ExamFormFillupExcelUploadRow>(
    filePath,
    EXAM_FORM_FILLUP_EXCEL_COLUMNS,
    (row) =>
      ({
        "CU Reg Number": String(row["CU Reg Number"] ?? "").trim(),
        "CU Roll Number": String(row["CU Roll Number"] ?? "").trim(),
        "Appear Type": String(row["Appear Type"] ?? "").trim(),
        "Form Fill Up Status": String(row["Form Fill Up Status"] ?? "").trim(),
      }) as ExamFormFillupExcelUploadRow,
    (m) =>
      !m["CU Reg Number"] &&
      !m["CU Roll Number"] &&
      !m["Appear Type"] &&
      !m["Form Fill Up Status"],
  );
}

const excelRowSchema = z.object({
  "CU Reg Number": z.coerce
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "CU Reg Number cannot be empty")),
  "CU Roll Number": z.coerce
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "CU Roll Number cannot be empty")),
  "Appear Type": z.coerce
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Appear Type cannot be empty")),
  "Form Fill Up Status": z.preprocess(
    (v) =>
      typeof v === "string"
        ? v.trim().toUpperCase()
        : String(v ?? "")
            .trim()
            .toUpperCase(),
    z.enum(["PENDING", "COMPLETED"], {
      errorMap: () => ({
        message: "Form Fill Up Status must be PENDING or COMPLETED",
      }),
    }),
  ),
});

export interface ExamFormFillupBulkUploadSuccessRow {
  row: number;
  promotionId: number;
  examFormFillupId: number;
}

export interface ExamFormFillupBulkUploadErrorRow {
  row: number;
  data: ExamFormFillupExcelUploadRow;
  error: string;
}

export interface ExamFormFillupBulkUploadResult {
  summary: { total: number; successful: number; failed: number };
  errors: ExamFormFillupBulkUploadErrorRow[];
  success: ExamFormFillupBulkUploadSuccessRow[];
  /** Present when the run was a simulation (no DB writes). */
  dryRun?: boolean;
  /** Parsed Excel row values (1-based `row` index), for bulk-upload UI preview on successful rows */
  fileRows?: Array<
    {
      row: number;
    } & Pick<
      ExamFormFillupExcelUploadRow,
      "CU Reg Number" | "CU Roll Number" | "Appear Type" | "Form Fill Up Status"
    >
  >;
}

export type BulkUploadExamFormFillupValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      errors: string[];
    };

function validateRowsFormat(
  data: unknown,
): BulkUploadExamFormFillupValidationResult {
  if (!Array.isArray(data)) {
    return { ok: false, errors: ["data must be a non-empty array of rows"] };
  }
  if (data.length === 0) {
    return { ok: false, errors: ["data must contain at least one row"] };
  }
  const msgs: string[] = [];
  for (let i = 0; i < data.length; i++) {
    const parsed = excelRowSchema.safeParse(data[i]);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      msgs.push(`Row ${i + 1}: ${detail}`);
    }
  }
  if (msgs.length > 0) {
    return { ok: false, errors: msgs };
  }
  return { ok: true };
}

function emitProgress(
  progressUserId: string | undefined,
  message: string,
  progress: number,
  status: "started" | "in_progress" | "completed" | "error",
  meta?: Record<string, unknown>,
) {
  if (!progressUserId) return;
  const update = socketService.createExportProgressUpdate(
    progressUserId,
    message,
    progress,
    status,
    undefined,
    undefined,
    undefined,
    {
      operation: "exam_form_fillup_bulk_upload",
      ...meta,
    },
  );
  socketService.sendProgressUpdate(progressUserId, update);
}

/** Match Excel "Appear Type" to `promotion_status.name` (trimmed, case-insensitive). */
function buildPromotionStatusLookup(
  statusRows: { id: number; name: string; type: string; isActive: boolean }[],
): Map<string, (typeof statusRows)[0]> {
  const map = new Map<string, (typeof statusRows)[0]>();
  for (const r of statusRows) {
    const key = r.name.trim().toLowerCase();
    if (!map.has(key)) map.set(key, r);
  }
  return map;
}

export async function bulkUploadExamFormFillup(
  props: BulkUploadExamFormFillupProps,
  options?: { progressUserId?: string; dryRun?: boolean },
): Promise<
  | { ok: true; result: ExamFormFillupBulkUploadResult }
  | { ok: false; errors: string[]; validationErrors?: string[] }
> {
  const { affiliationId, regulationTypeId, academicYearId, classId, data } =
    props;
  const progressUserId = options?.progressUserId;
  const dryRun = options?.dryRun === true;

  const formatCheck = validateRowsFormat(data);
  if (!formatCheck.ok) {
    return {
      ok: false,
      errors: ["One or more rows failed format validation."],
      validationErrors: formatCheck.errors,
    };
  }

  const rows = data.map((row) => excelRowSchema.parse(row));

  const promotionStatuses = await db
    .select({
      id: promotionStatusModel.id,
      name: promotionStatusModel.name,
      type: promotionStatusModel.type,
      isActive: promotionStatusModel.isActive,
    })
    .from(promotionStatusModel)
    .where(eq(promotionStatusModel.isActive, true));

  const statusByName = buildPromotionStatusLookup(promotionStatuses);

  const distinctAppearTypes = [
    ...new Set(rows.map((r) => r["Appear Type"].trim().toLowerCase())),
  ];

  const missingStatuses: string[] = [];
  for (const appear of distinctAppearTypes) {
    if (!statusByName.has(appear)) {
      const original = rows.find(
        (r) => r["Appear Type"].trim().toLowerCase() === appear,
      )?.["Appear Type"];
      missingStatuses.push(original ?? appear);
    }
  }

  if (missingStatuses.length > 0) {
    return {
      ok: false,
      errors: [
        `Unknown or inactive Appear Type value(s) not found in promotion_status: ${missingStatuses.join(", ")}. Names must match an active promotion status (case-insensitive).`,
      ],
    };
  }

  emitProgress(progressUserId, "Resolving session…", 5, "started");

  const sessions = await db
    .select({ id: sessionModel.id })
    .from(sessionModel)
    .where(eq(sessionModel.academicYearId, academicYearId))
    .orderBy(desc(sessionModel.isCurrentSession));

  if (sessions.length === 0) {
    emitProgress(progressUserId, "No session for academic year.", 100, "error");
    return {
      ok: false,
      errors: ["No session found for the given academicYearId."],
    };
  }

  const sessionId = sessions[0].id!;

  /** All active program courses for this affiliation + regulation (`program_courses`). Promotions reference one of these via `promotions.program_course_id_fk`. */
  const eligibleProgramCourseRows = await db
    .select({ id: programCourseModel.id })
    .from(programCourseModel)
    .where(
      and(
        eq(programCourseModel.affiliationId, affiliationId),
        eq(programCourseModel.regulationTypeId, regulationTypeId),
        eq(programCourseModel.isActive, true),
      ),
    );
  const eligibleProgramCourseIds = eligibleProgramCourseRows
    .map((r) => r.id)
    .filter((id): id is number => id != null);

  if (eligibleProgramCourseIds.length === 0) {
    emitProgress(
      progressUserId,
      "No program course for affiliation and regulation.",
      100,
      "error",
    );
    return {
      ok: false,
      errors: [
        "No active program course found for the given affiliationId and regulationTypeId.",
      ],
    };
  }

  const result: ExamFormFillupBulkUploadResult = {
    summary: { total: rows.length, successful: 0, failed: 0 },
    errors: [],
    success: [],
  };

  emitProgress(
    progressUserId,
    `Processing ${rows.length} row(s)…`,
    15,
    "in_progress",
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    const progressPct = 15 + Math.floor((i / Math.max(rows.length, 1)) * 80);

    try {
      const appearKey = row["Appear Type"].trim().toLowerCase();
      const promoStatus = statusByName.get(appearKey);
      if (!promoStatus) {
        throw new Error(
          `Appear Type "${row["Appear Type"]}" does not match an active promotion status.`,
        );
      }

      const reg = row["CU Reg Number"].trim();
      const roll = row["CU Roll Number"].trim();

      const studentMatches = await db
        .select({ id: studentModel.id })
        .from(studentModel)
        .where(
          and(
            sql`trim(${studentModel.registrationNumber}) = ${reg}`,
            sql`trim(${studentModel.rollNumber}) = ${roll}`,
          ),
        )
        .limit(3);

      if (studentMatches.length === 0) {
        throw new Error(
          `No student found with CU Reg Number "${reg}" and CU Roll Number "${roll}".`,
        );
      }
      if (studentMatches.length > 1) {
        throw new Error(
          `Multiple students share registration "${reg}" and roll "${roll}".`,
        );
      }

      const student = studentMatches[0];

      /**
       * `promotions` (see `@repo/db` promotionModel): one row ties student → program course → session → class → promotion status.
       * Resolve using: (1) program course id ∈ courses for affiliation+regulation, (2) class id from context,
       * (3) student id from CU Reg/Roll, plus session and Appear Type (promotion_status) for this academic year.
       */
      const promotions = await db
        .select({ id: promotionModel.id })
        .from(promotionModel)
        .where(
          and(
            eq(promotionModel.studentId, student.id),
            eq(promotionModel.sessionId, sessionId),
            eq(promotionModel.classId, classId),
            eq(promotionModel.promotionStatusId, promoStatus.id),
            inArray(promotionModel.programCourseId, eligibleProgramCourseIds),
          ),
        )
        .limit(2);

      if (promotions.length === 0) {
        throw new Error(
          `No promotion found for this student (CU Reg/Roll), selected class, session, Appear Type "${promoStatus.name}", and a program course under the selected affiliation and regulation.`,
        );
      }
      if (promotions.length > 1) {
        throw new Error(
          "Multiple promotions match the same student, session, class, appear type, and eligible program course; check for duplicate promotion rows.",
        );
      }

      const promotionId = promotions[0].id!;
      const fillupStatus = row["Form Fill Up Status"];

      const existing = await db
        .select({ id: examFormFillupModel.id })
        .from(examFormFillupModel)
        .where(eq(examFormFillupModel.promotionId, promotionId))
        .limit(1);

      let examFormFillupId: number;

      if (dryRun) {
        examFormFillupId = existing[0]?.id ?? 0;
      } else if (existing[0]) {
        const [updated] = await db
          .update(examFormFillupModel)
          .set({
            status: fillupStatus,
            updatedAt: new Date(),
          })
          .where(eq(examFormFillupModel.id, existing[0].id))
          .returning({ id: examFormFillupModel.id });
        examFormFillupId = updated!.id;
      } else {
        const [inserted] = await db
          .insert(examFormFillupModel)
          .values({
            promotionId,
            status: fillupStatus,
          })
          .returning({ id: examFormFillupModel.id });
        examFormFillupId = inserted!.id;
      }

      result.success.push({
        row: rowNumber,
        promotionId,
        examFormFillupId,
      });
      result.summary.successful++;

      emitProgress(
        progressUserId,
        dryRun
          ? `Row ${rowNumber} of ${rows.length} — dry run (no write)`
          : `Row ${rowNumber} of ${rows.length} saved`,
        progressPct,
        "in_progress",
        { row: rowNumber, promotionId, dryRun },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push({
        row: rowNumber,
        data: {
          "CU Reg Number": row["CU Reg Number"],
          "CU Roll Number": row["CU Roll Number"],
          "Appear Type": row["Appear Type"],
          "Form Fill Up Status": row["Form Fill Up Status"],
        },
        error: msg,
      });
      result.summary.failed++;
    }
  }

  emitProgress(
    progressUserId,
    dryRun
      ? `Dry run done: ${result.summary.successful} would save, ${result.summary.failed} failed`
      : `Done: ${result.summary.successful} saved, ${result.summary.failed} failed`,
    100,
    "completed",
    { summary: result.summary, dryRun },
  );

  const fileRows = rows.map((r, i) => ({
    row: i + 1,
    "CU Reg Number": r["CU Reg Number"],
    "CU Roll Number": r["CU Roll Number"],
    "Appear Type": r["Appear Type"],
    "Form Fill Up Status": r["Form Fill Up Status"],
  }));

  return { ok: true, result: { ...result, dryRun, fileRows } };
}

// --- CU Reg / Roll by UID (bulk-data-uploads mode: cu-reg-roll) ---

export interface BulkUploadCuRegRollProps {
  data: CuRegRollExcelUploadRow[];
  uploadSessionId?: string;
}

export const CU_REG_ROLL_EXCEL_COLUMNS = [
  "UID",
  "CU Reg Number",
  "CU Roll Number",
] as const;

export function parseCuRegRollExcelFile(
  filePath: string,
): CuRegRollExcelUploadRow[] {
  return parseBulkExcelWithRequiredColumns<CuRegRollExcelUploadRow>(
    filePath,
    CU_REG_ROLL_EXCEL_COLUMNS,
    (row) =>
      ({
        UID: String(row["UID"] ?? "").trim(),
        "CU Reg Number": String(row["CU Reg Number"] ?? "").trim(),
        "CU Roll Number": String(row["CU Roll Number"] ?? "").trim(),
      }) as CuRegRollExcelUploadRow,
    (m) => !m.UID && !m["CU Reg Number"] && !m["CU Roll Number"],
  );
}

const cuRegRollRowSchema = z
  .object({
    UID: z.coerce
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, "UID cannot be empty")),
    "CU Reg Number": z.coerce.string().transform((s) => s.trim()),
    "CU Roll Number": z.coerce.string().transform((s) => s.trim()),
  })
  .superRefine((row, ctx) => {
    if (!row["CU Reg Number"] && !row["CU Roll Number"]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least CU Reg Number or CU Roll Number",
        path: ["CU Reg Number"],
      });
    }
  });

type CuRegRollRowsValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

function validateCuRegRollRowsFormat(
  data: unknown,
): CuRegRollRowsValidationResult {
  if (!Array.isArray(data)) {
    return { ok: false, errors: ["data must be a non-empty array of rows"] };
  }
  if (data.length === 0) {
    return { ok: false, errors: ["data must contain at least one row"] };
  }
  const msgs: string[] = [];
  for (let i = 0; i < data.length; i++) {
    const parsed = cuRegRollRowSchema.safeParse(data[i]);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      msgs.push(`Row ${i + 1}: ${detail}`);
    }
  }
  if (msgs.length > 0) {
    return { ok: false, errors: msgs };
  }
  return { ok: true };
}

export async function bulkUploadCuRegRoll(
  props: BulkUploadCuRegRollProps,
  options?: { progressUserId?: string; dryRun?: boolean },
): Promise<
  | {
      ok: true;
      result: Awaited<ReturnType<typeof updateStudentCuRollAndRegistration>>;
    }
  | { ok: false; errors: string[]; validationErrors?: string[] }
> {
  const formatCheck = validateCuRegRollRowsFormat(props.data);
  if (!formatCheck.ok) {
    return {
      ok: false,
      errors: ["One or more rows failed format validation."],
      validationErrors: formatCheck.errors,
    };
  }

  const rows = props.data.map((row) => cuRegRollRowSchema.parse(row));

  const serviceRows = rows.map((row, index) => ({
    rowNumber: index + 2,
    uid: row.UID,
    cuRollNumber: row["CU Roll Number"] || null,
    cuRegistrationNumber: row["CU Reg Number"] || null,
  }));

  const result = await updateStudentCuRollAndRegistration(
    serviceRows,
    options?.progressUserId,
    { dryRun: options?.dryRun },
  );

  return { ok: true, result };
}

export {
  readBulkExcelSheet,
  validateBulkExcelRequiredColumns,
  filterNonEmptyBulkRows,
  parseBulkExcelWithRequiredColumns,
  type ReadBulkExcelSheetResult,
} from "../utils/parse-bulk-upload-excel.js";
