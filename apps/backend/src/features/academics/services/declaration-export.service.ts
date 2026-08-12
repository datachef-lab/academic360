import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import {
  applyStandardExcelReportTableStyling,
  autosizeExcelSheetColumns,
} from "@/utils/excel-report-styling.js";
import {
  buildReportFilterClauses,
  type ReportExportFilters,
} from "@/utils/report-export-filters.js";

/**
 * Admin Excel export of student declarations — one row per declaration
 * (student x promotion x declaration master), with dynamic columns for the
 * master's statements and the fields captured under them.
 *
 * Mirrors the career-progression export: fixed identity columns first, then
 * one column per ACTIVE master statement (Yes/No) followed by one column per
 * ACTIVE field of that statement. Only the masters actually present in the
 * filtered result set contribute columns.
 */

const FIXED_HEADERS = [
  "#",
  "Student name",
  "UID",
  "Registration no",
  "Roll no",
  "Program course",
  "Semester",
  "Shift",
  "Section",
  "Academic year",
  "Declaration",
  "Context",
  "Declared on",
] as const;

const STATEMENT_HEADER_MAX = 80;
const STATEMENT_PREFIX_MAX = 40;

export type DeclarationReportParams = {
  academicYearId?: number;
  /** declarationMasterContextEnum: ADMISSION | EXAM | FEES | LIBRARY | OTHER */
  context?: string;
  declarationMasterId?: number;
  filters?: ReportExportFilters;
  onProgress?: (pct: number, message: string) => void;
};

const VALID_CONTEXTS = new Set([
  "ADMISSION",
  "EXAM",
  "FEES",
  "LIBRARY",
  "OTHER",
]);

type DeclarationRow = {
  declaration_id: number;
  declaration_master_id: number;
  master_name: string | null;
  context: string | null;
  student_name: string | null;
  uid: string | null;
  registration_number: string | null;
  roll_number: string | null;
  program_course: string | null;
  semester: string | null;
  shift: string | null;
  section: string | null;
  academic_year: string | null;
  declared_on: string | null;
};

type ColumnSpec =
  | { kind: "statement"; header: string; masterStatementId: number }
  | {
      kind: "field";
      header: string;
      masterStatementId: number;
      masterFieldId: number;
    };

function truncateForHeader(text: string, max: number): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

/** Fetches the declarations that match the filters (one row per declaration). */
async function fetchDeclarationRows(
  params: DeclarationReportParams,
): Promise<DeclarationRow[]> {
  const filterClause = sql.raw(
    buildReportFilterClauses(params.filters ?? {}, {
      programCourseId: "pc.id",
      affiliationId: "pc.affiliation_id_fk",
      regulationTypeId: "pc.regulation_type_id_fk",
      classId: "pr.class_id_fk",
      activeId: "u.is_active",
    }),
  );

  const context =
    params.context && VALID_CONTEXTS.has(params.context.toUpperCase())
      ? params.context.toUpperCase()
      : undefined;

  const { rows } = await db.execute(sql`
    SELECT
      d.id                       AS declaration_id,
      d.declaration_master_id_fk AS declaration_master_id,
      dm.name                    AS master_name,
      dm.context::text           AS context,
      u.name                     AS student_name,
      std.uid                    AS uid,
      std.registration_number    AS registration_number,
      std.roll_number            AS roll_number,
      pc.name                    AS program_course,
      cls.name                   AS semester,
      sh.name                    AS shift,
      sec.name                   AS section,
      ay.year                    AS academic_year,
      TO_CHAR(d.created_at, 'DD/MM/YYYY, HH12:MI:SS AM') AS declared_on
    FROM declarations d
    JOIN declaration_masters dm ON dm.id = d.declaration_master_id_fk
    JOIN promotions pr ON pr.id = d.promotion_id_fk
    JOIN students std ON std.id = pr.student_id_fk
    JOIN users u ON u.id = std.user_id_fk
    LEFT JOIN program_courses pc ON pc.id = pr.program_course_id_fk
    LEFT JOIN classes cls ON cls.id = pr.class_id_fk
    LEFT JOIN shifts sh ON sh.id = pr.shift_id_fk
    LEFT JOIN sections sec ON sec.id = pr.section_id_fk
    LEFT JOIN sessions s ON s.id = pr.session_id_fk
    LEFT JOIN academic_years ay ON ay.id = s.academic_id_fk
    WHERE COALESCE(pr.is_deprecated, false) = false
    ${params.academicYearId ? sql` AND ay.id = ${params.academicYearId}` : sql``}
    ${context ? sql` AND dm.context = ${context}::declaration_master_context` : sql``}
    ${params.declarationMasterId ? sql` AND dm.id = ${params.declarationMasterId}` : sql``}
    ${filterClause}
    ORDER BY dm.id, u.name, d.id
  `);

  return rows as unknown as DeclarationRow[];
}

/**
 * Builds the dynamic column list from the ACTIVE statements (and their active
 * fields) of the masters present in the result set, in sequence order.
 */
async function resolveDynamicColumns(
  masterIds: number[],
  multipleMasters: boolean,
): Promise<ColumnSpec[]> {
  if (masterIds.length === 0) return [];

  const idList = masterIds
    .filter((id) => Number.isInteger(id) && id > 0)
    .join(",");
  if (!idList) return [];

  const { rows } = await db.execute(sql`
    SELECT
      dm.id     AS master_id,
      dm.name   AS master_name,
      dms.id    AS master_statement_id,
      dms.statement AS statement,
      dms.sequence  AS statement_sequence,
      dmsf.id       AS master_field_id,
      dmsf.label    AS field_label,
      dmsf.sequence AS field_sequence
    FROM declaration_master_statements dms
    JOIN declaration_masters dm ON dm.id = dms.declaration_master_id_fk
    LEFT JOIN declaration_master_statement_fields dmsf
      ON dmsf.declaration_master_statement_id_fk = dms.id
     AND dmsf.is_active = true
    WHERE dms.is_active = true
      AND dms.declaration_master_id_fk IN (${sql.raw(idList)})
    ORDER BY dm.id, dms.sequence, dms.id, dmsf.sequence, dmsf.id
  `);

  const columns: ColumnSpec[] = [];
  const seenStatements = new Set<number>();

  for (const raw of rows as unknown as Array<{
    master_name: string | null;
    master_statement_id: number;
    statement: string | null;
    master_field_id: number | null;
    field_label: string | null;
  }>) {
    const statementId = Number(raw.master_statement_id);
    const statementText = text(raw.statement);
    const masterPrefix =
      multipleMasters && raw.master_name ? `${raw.master_name} - ` : "";

    if (!seenStatements.has(statementId)) {
      seenStatements.add(statementId);
      columns.push({
        kind: "statement",
        masterStatementId: statementId,
        header: `${masterPrefix}${truncateForHeader(statementText, STATEMENT_HEADER_MAX)}`,
      });
    }

    if (raw.master_field_id != null) {
      const shortStatement = truncateForHeader(
        statementText,
        STATEMENT_PREFIX_MAX,
      );
      columns.push({
        kind: "field",
        masterStatementId: statementId,
        masterFieldId: Number(raw.master_field_id),
        header: `${masterPrefix}${shortStatement} - ${text(raw.field_label)}`,
      });
    }
  }

  return columns;
}

/** The submitted answers, keyed by declaration id. */
async function fetchAnswers(declarationIds: number[]) {
  const idList = declarationIds
    .filter((id) => Number.isInteger(id) && id > 0)
    .join(",");

  /** declarationId -> masterStatementId -> "Yes" | "No" */
  const agreedByDeclaration = new Map<number, Map<number, string>>();
  /** declarationId -> `${masterStatementId}:${masterFieldId}` -> value */
  const fieldValuesByDeclaration = new Map<number, Map<string, string>>();

  if (!idList) return { agreedByDeclaration, fieldValuesByDeclaration };

  const { rows: statementRows } = await db.execute(sql`
    SELECT
      ds.declaration_id_fk AS declaration_id,
      ds.declaration_master_statement_id_fk AS master_statement_id,
      ds.is_agreed AS is_agreed
    FROM declaration_statements ds
    WHERE ds.declaration_id_fk IN (${sql.raw(idList)})
  `);

  for (const raw of statementRows as unknown as Array<{
    declaration_id: number;
    master_statement_id: number;
    is_agreed: boolean | null;
  }>) {
    const declarationId = Number(raw.declaration_id);
    const bucket =
      agreedByDeclaration.get(declarationId) ?? new Map<number, string>();
    bucket.set(
      Number(raw.master_statement_id),
      raw.is_agreed === true ? "Yes" : "No",
    );
    agreedByDeclaration.set(declarationId, bucket);
  }

  const { rows: fieldRows } = await db.execute(sql`
    SELECT
      ds.declaration_id_fk AS declaration_id,
      ds.declaration_master_statement_id_fk AS master_statement_id,
      dsf.declaration_master_statement_field_id_fk AS master_field_id,
      dsf.value AS value,
      dmso.name AS option_name
    FROM declaration_statement_fields dsf
    JOIN declaration_statements ds ON ds.id = dsf.declaration_statement_id_fk
    LEFT JOIN declaration_master_statement_field_options dmso
      ON dmso.id = dsf.declaration_master_statement_field_option_id_fk
    WHERE ds.declaration_id_fk IN (${sql.raw(idList)})
  `);

  for (const raw of fieldRows as unknown as Array<{
    declaration_id: number;
    master_statement_id: number;
    master_field_id: number;
    value: string | null;
    option_name: string | null;
  }>) {
    const declarationId = Number(raw.declaration_id);
    const bucket =
      fieldValuesByDeclaration.get(declarationId) ?? new Map<string, string>();
    // A SELECT field stores the chosen option; free text lives in `value`.
    const value = text(raw.option_name).trim() || text(raw.value).trim();
    bucket.set(
      `${Number(raw.master_statement_id)}:${Number(raw.master_field_id)}`,
      value,
    );
    fieldValuesByDeclaration.set(declarationId, bucket);
  }

  return { agreedByDeclaration, fieldValuesByDeclaration };
}

export async function exportDeclarationsReport(
  params: DeclarationReportParams = {},
): Promise<{ buffer: Buffer; fileName: string; totalRecords: number }> {
  const report = params.onProgress ?? (() => {});

  report(10, "Loading declarations…");
  const declarationRows = await fetchDeclarationRows(params);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("declarations");

  let headerCount = 1;

  if (declarationRows.length > 0) {
    const masterIds = [
      ...new Set(declarationRows.map((r) => Number(r.declaration_master_id))),
    ].sort((a, b) => a - b);

    report(35, "Resolving declaration statement columns…");
    const dynamicColumns = await resolveDynamicColumns(
      masterIds,
      masterIds.length > 1,
    );

    report(55, `Loading answers for ${declarationRows.length} declaration(s)…`);
    const { agreedByDeclaration, fieldValuesByDeclaration } =
      await fetchAnswers(declarationRows.map((r) => Number(r.declaration_id)));

    report(75, "Writing worksheet…");
    const headers = [...FIXED_HEADERS, ...dynamicColumns.map((c) => c.header)];
    headerCount = headers.length;
    sheet.addRow(headers);

    declarationRows.forEach((row, index) => {
      const declarationId = Number(row.declaration_id);
      const agreed = agreedByDeclaration.get(declarationId);
      const fieldValues = fieldValuesByDeclaration.get(declarationId);

      const fixed: string[] = [
        String(index + 1),
        text(row.student_name),
        text(row.uid),
        text(row.registration_number),
        text(row.roll_number),
        text(row.program_course),
        text(row.semester),
        text(row.shift),
        text(row.section),
        text(row.academic_year),
        text(row.master_name),
        text(row.context),
        text(row.declared_on),
      ];

      const dynamic = dynamicColumns.map((col) => {
        if (col.kind === "statement") {
          return agreed?.get(col.masterStatementId) ?? "";
        }
        return (
          fieldValues?.get(`${col.masterStatementId}:${col.masterFieldId}`) ??
          ""
        );
      });

      sheet.addRow([...fixed, ...dynamic]);
    });
  } else {
    sheet.addRow(["message"]);
    sheet.addRow(["No data available"]);
  }

  applyStandardExcelReportTableStyling(sheet);
  autosizeExcelSheetColumns(sheet, headerCount, {
    minWidth: 10,
    maxWidth: 55,
  });

  report(90, "Finalizing workbook…");
  const excelBuffer = await workbook.xlsx.writeBuffer();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return {
    buffer: Buffer.isBuffer(excelBuffer)
      ? excelBuffer
      : Buffer.from(excelBuffer),
    fileName: `declaration-report_${timestamp}.xlsx`,
    totalRecords: declarationRows.length,
  };
}
