import ExcelJS from "exceljs";
import { Writable } from "node:stream";
import type { CareerProgressionFormDto } from "@repo/db/dtos/academics";
import {
  styleStreamedBodyRow,
  styleStreamedHeaderRow,
} from "@/utils/excel-report-styling.js";
import { findAllCertificateFieldMasters } from "./certificate-field-master.service.js";
import { findAllCertificateMasters } from "./certificate-master.service.js";
import type { ReportExportFilters } from "@/utils/report-export-filters.js";
import { findAllCareerProgressionForms } from "./career-progression-form.service.js";

const FIXED_HEADERS = [
  "#",
  "Student name",
  "UID",
  "Reg",
  "Roll",
  "Program-course",
  "Semester",
  "Shift",
  "Section",
  "Student status",
  "Academic year",
  "Certificate name",
] as const;

type FieldColumn = {
  fieldMasterId: number;
  header: string;
  certificateSequence: number;
  sequence: number;
};

function displayFieldValue(
  field: CareerProgressionFormDto["certificates"][number]["fields"][number],
): string {
  const opt = field.certificateFieldOptionMaster?.name?.trim();
  if (opt) return opt;
  return (field.value ?? "").trim();
}

function buildFieldHeader(
  fieldName: string,
  certificateName: string,
  nameCounts: Map<string, number>,
): string {
  const needsCertPrefix = (nameCounts.get(fieldName) ?? 0) > 1;
  if (needsCertPrefix && certificateName) {
    return `${certificateName} - ${fieldName}`;
  }
  return fieldName;
}

async function resolveFieldColumns(
  forms: CareerProgressionFormDto[],
): Promise<FieldColumn[]> {
  const [masters, fields] = await Promise.all([
    findAllCertificateMasters(),
    findAllCertificateFieldMasters(),
  ]);

  const activeMasters = masters.filter((m) => m.isActive);
  const masterById = new Map(activeMasters.map((m) => [m.id, m]));

  const activeFields = fields.filter(
    (f) => f.isActive && masterById.has(f.certificateMasterId) && f.name.trim(),
  );

  if (activeFields.length === 0) {
    return fieldColumnsFromForms(forms);
  }

  const nameCounts = new Map<string, number>();
  for (const field of activeFields) {
    const name = field.name.trim();
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }

  const columns: FieldColumn[] = activeFields
    .filter((field): field is typeof field & { id: number } => field.id != null)
    .map((field) => {
      const cert = masterById.get(field.certificateMasterId)!;
      const fieldName = field.name.trim();
      return {
        fieldMasterId: field.id,
        header: buildFieldHeader(fieldName, cert.name, nameCounts),
        certificateSequence: cert.sequence,
        sequence: field.sequence,
      };
    });

  return sortFieldColumns(columns);
}

function fieldColumnsFromForms(
  forms: CareerProgressionFormDto[],
): FieldColumn[] {
  const seen = new Set<number>();
  const columns: FieldColumn[] = [];
  const nameCounts = new Map<string, number>();

  for (const form of forms) {
    for (const cert of form.certificates ?? []) {
      for (const field of cert.fields ?? []) {
        if (field.certificateFieldMaster?.isActive === false) continue;
        const name = field.certificateFieldMaster?.name?.trim();
        if (name) nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
      }
    }
  }

  for (const form of forms) {
    for (const cert of form.certificates ?? []) {
      const certName = cert.certificateMaster?.name ?? "";
      const certSequence = cert.certificateMaster?.sequence ?? 0;
      for (const field of cert.fields ?? []) {
        const master = field.certificateFieldMaster;
        if (master?.isActive === false) continue;
        const masterId = master?.id;
        const fieldName = master?.name?.trim();
        if (masterId == null || !fieldName || seen.has(masterId)) continue;
        seen.add(masterId);
        columns.push({
          fieldMasterId: masterId,
          header: buildFieldHeader(fieldName, certName, nameCounts),
          certificateSequence: certSequence,
          sequence: master.sequence ?? 0,
        });
      }
    }
  }

  return sortFieldColumns(columns);
}

function sortFieldColumns(columns: FieldColumn[]): FieldColumn[] {
  return [...columns].sort((a, b) => {
    if (a.certificateSequence !== b.certificateSequence) {
      return a.certificateSequence - b.certificateSequence;
    }
    if (a.sequence !== b.sequence) return a.sequence - b.sequence;
    return a.header.localeCompare(b.header);
  });
}

function certificateNamesForForm(form: CareerProgressionFormDto): string {
  const names = (form.certificates ?? [])
    .filter((cert) => cert.certificateMaster?.isActive !== false)
    .map((cert) => cert.certificateMaster?.name?.trim())
    .filter((name): name is string => Boolean(name));
  return [...new Set(names)].join(", ");
}

function buildDataRows(
  forms: CareerProgressionFormDto[],
  fieldColumns: FieldColumn[],
): string[][] {
  return forms.map((form, index) => {
    const st = form.student;
    const valuesByFieldId = new Map<number, string[]>();

    for (const cert of form.certificates ?? []) {
      if (cert.certificateMaster?.isActive === false) continue;
      for (const field of cert.fields ?? []) {
        const master = field.certificateFieldMaster;
        if (master?.isActive === false) continue;
        const masterId = master?.id;
        if (masterId == null) continue;
        const value = displayFieldValue(field);
        if (!value) continue;
        const bucket = valuesByFieldId.get(masterId) ?? [];
        bucket.push(value);
        valuesByFieldId.set(masterId, bucket);
      }
    }

    const fixed: string[] = [
      String(index + 1),
      st?.name ?? "",
      st?.uid ?? "",
      st?.registrationNumber ?? "",
      st?.rollNumber ?? "",
      st?.programCourse ?? "",
      st?.semester ?? "",
      st?.shift ?? "",
      st?.section ?? "",
      st?.studentStatus ?? "",
      form.academicYear?.year ?? "",
      certificateNamesForForm(form),
    ];

    const dynamic = fieldColumns.map((col) => {
      const values = valuesByFieldId.get(col.fieldMasterId);
      if (!values?.length) return "";
      return values.join("; ");
    });

    return [...fixed, ...dynamic];
  });
}

/**
 * Pure filename builder — split out of `exportCareerProgressionFormsExcel`
 * so the controller can set `Content-Disposition` BEFORE the streaming
 * write starts (the old buffered version could set headers after the
 * buffer was built; a stream can't — headers must go out before the first
 * byte of body).
 */
export function careerProgressionExportFileName(
  academicYearId?: number,
): string {
  const datePart = new Date().toISOString().split("T")[0];
  const yearPart =
    academicYearId != null ? `year-${academicYearId}` : "all-years";
  return `career-progression-forms_${yearPart}_${datePart}.xlsx`;
}

/** Mirrors `autosizeExcelSheetColumns`'s heuristic, but computed directly off
 * the in-memory header/data arrays (all string values here) instead of
 * reading back already-committed streamed cells, which isn't possible with
 * `ExcelJS.stream.xlsx.WorkbookWriter` once a row is committed. Same
 * min/max/padding constants as the call this replaces, so widths are
 * unchanged. */
function computeColumnWidths(
  headers: readonly string[],
  dataRows: readonly string[][],
  minWidth: number,
  maxWidth: number,
): number[] {
  const widths = headers.map(() => minWidth);
  const allRows: readonly string[][] = [headers as string[], ...dataRows];
  for (const row of allRows) {
    for (let c = 0; c < headers.length; c++) {
      const len = row[c] == null ? 0 : String(row[c]).length;
      widths[c] = Math.max(widths[c], Math.min(len + 2, maxWidth));
    }
  }
  return widths;
}

/**
 * Streams the career-progression export directly to `res`. The submission
 * fetch (`findAllCareerProgressionForms`) and DTO shaping are unchanged —
 * that pipeline lives in career-progression-form.service.ts and does its
 * own per-form enrichment queries; chunking it is out of scope here (see
 * PR notes). What changed is that the workbook is no longer built fully in
 * memory and serialized to a `Buffer` before anything is sent: rows are
 * written straight to the HTTP response as they're produced, so the
 * (already in-memory) row data isn't ALSO held as a fully zipped/compressed
 * buffer at the same time.
 */
export async function exportCareerProgressionFormsExcel(params: {
  academicYearId?: number;
  filters?: ReportExportFilters;
  onProgress?: (pct: number, message: string) => void;
  // A plain `NodeJS.WritableStream` (not Express's `Response`) — this is
  // all ExcelJS's `WorkbookWriter` needs, and it lets the report-job queue
  // in reports/report-generators.ts reuse this streaming path via a
  // `PassThrough` to still get a `Buffer` back for its job-storage
  // contract.
  res: Writable;
}): Promise<{
  fileName: string;
  rowCount: number;
  fieldColumnCount: number;
}> {
  const report = params.onProgress ?? (() => {});

  report(10, "Loading career progression submissions…");
  const forms = await findAllCareerProgressionForms(
    undefined,
    params.academicYearId,
    params.filters,
  );

  report(55, `Building columns for ${forms.length} submission(s)…`);
  const fieldColumns = await resolveFieldColumns(forms);
  const headers = [...FIXED_HEADERS, ...fieldColumns.map((c) => c.header)];
  const dataRows = buildDataRows(forms, fieldColumns);

  report(75, "Writing worksheet…");

  const widths = computeColumnWidths(headers, dataRows, 10, 55);

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: params.res,
    useStyles: true,
    useSharedStrings: true,
  });
  const sheet = workbook.addWorksheet("Career progression", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = headers.map((header, i) => ({
    header,
    key: String(i),
    width: widths[i],
  }));
  styleStreamedHeaderRow(sheet.getRow(1));
  sheet.getRow(1).commit();

  for (const row of dataRows) {
    const dataRow = sheet.addRow(row);
    styleStreamedBodyRow(dataRow);
    dataRow.commit();
  }

  sheet.commit();
  await workbook.commit();

  return {
    fileName: careerProgressionExportFileName(params.academicYearId),
    rowCount: dataRows.length,
    fieldColumnCount: fieldColumns.length,
  };
}
