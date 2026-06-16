import ExcelJS from "exceljs";
import type { CareerProgressionFormDto } from "@repo/db/dtos/academics";
import {
  applyStandardExcelReportTableStyling,
  autosizeExcelSheetColumns,
} from "@/utils/excel-report-styling.js";
import { findAllCertificateFieldMasters } from "./certificate-field-master.service.js";
import { findAllCertificateMasters } from "./certificate-master.service.js";
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

export async function exportCareerProgressionFormsExcel(params: {
  academicYearId?: number;
}): Promise<{
  buffer: Buffer;
  fileName: string;
  rowCount: number;
  fieldColumnCount: number;
}> {
  const forms = await findAllCareerProgressionForms(
    undefined,
    params.academicYearId,
  );

  const fieldColumns = await resolveFieldColumns(forms);
  const headers = [...FIXED_HEADERS, ...fieldColumns.map((c) => c.header)];
  const dataRows = buildDataRows(forms, fieldColumns);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Career progression");

  sheet.addRow(headers);
  for (const row of dataRows) {
    sheet.addRow(row);
  }

  if (sheet.rowCount > 0) {
    applyStandardExcelReportTableStyling(sheet);
    autosizeExcelSheetColumns(sheet, headers.length, {
      minWidth: 10,
      maxWidth: 55,
    });
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.isBuffer(excelBuffer)
    ? excelBuffer
    : Buffer.from(excelBuffer);

  const datePart = new Date().toISOString().split("T")[0];
  const yearPart =
    params.academicYearId != null
      ? `year-${params.academicYearId}`
      : "all-years";

  return {
    buffer,
    fileName: `career-progression-forms_${yearPart}_${datePart}.xlsx`,
    rowCount: dataRows.length,
    fieldColumnCount: fieldColumns.length,
  };
}
