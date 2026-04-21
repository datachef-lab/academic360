import { pool } from "@/db/index.js";
import { buildStudentSubjectsExportSql } from "@/features/subject-selection/services/student-subject-selection.service.js";
import type { ReportExportFilters } from "@/utils/report-export-filters.js";
import { applyReportHeaderAndFreezeOnly } from "@/utils/excel-report-styling.js";
import ExcelJS from "exceljs";

function rosterFilterSql(filters: ReportExportFilters): string {
  const parts: string[] = [];
  const ints = (ids?: number[]) =>
    ids?.filter((n) => Number.isInteger(n) && n > 0) ?? [];
  const pc = ints(filters.programCourseIds);
  if (pc.length) parts.push(` AND pc.id IN (${pc.join(",")})`);
  const aff = ints(filters.affiliationIds);
  if (aff.length) parts.push(` AND pc.affiliation_id_fk IN (${aff.join(",")})`);
  const reg = ints(filters.regulationTypeIds);
  if (reg.length)
    parts.push(` AND pc.regulation_type_id_fk IN (${reg.join(",")})`);
  const cls = ints(filters.classIds);
  if (cls.length) parts.push(` AND pr.class_id_fk IN (${cls.join(",")})`);
  return parts.join("");
}

type PaperEntry = { paper: string; paper_code: string };

/** Dedupe papers per roster line (student + promotion in report year). */
function buildPapersByStudentPromotion(
  paperRows: {
    student_id: number;
    promotion_id: number;
    paper: string;
    paper_code: string;
  }[],
): Map<string, PaperEntry[]> {
  const papersByKey = new Map<string, PaperEntry[]>();
  const seenByKey = new Map<string, Set<string>>();

  for (const r of paperRows) {
    const sid = r.student_id;
    const pid = r.promotion_id;
    const mapKey = `${sid}:${pid}`;
    const paper = (r.paper ?? "").trim();
    const paper_code = (r.paper_code ?? "").trim();
    const dedupeKey = `${paper}\0${paper_code}`;

    let seen = seenByKey.get(mapKey);
    if (!seen) {
      seen = new Set();
      seenByKey.set(mapKey, seen);
    }
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const list = papersByKey.get(mapKey) ?? [];
    list.push({ paper, paper_code });
    papersByKey.set(mapKey, list);
  }

  for (const [, entries] of papersByKey) {
    entries.sort((a, b) => {
      const p = a.paper.localeCompare(b.paper);
      if (p !== 0) return p;
      return a.paper_code.localeCompare(b.paper_code);
    });
  }

  return papersByKey;
}

/** Roster: one row per promotion in the academic year (same student may appear multiple times). */
function buildStudentRosterSql(
  academicYearId: number,
  filters: ReportExportFilters,
) {
  const rosterFilters = rosterFilterSql(filters);
  const text = `
WITH promotions_in_year AS (
  SELECT
    pr.id AS promotion_id,
    pr.student_id_fk,
    pr.program_course_id_fk,
    pr.session_id_fk,
    pr.class_id_fk,
    pr.section_id_fk,
    pr.shift_id_fk,
    pr.roll_number
  FROM promotions pr
  JOIN sessions sess_lp ON sess_lp.id = pr.session_id_fk
  JOIN academic_years ay_lp ON ay_lp.id = sess_lp.academic_id_fk
  WHERE pr.is_alumni IS NOT TRUE
    AND ay_lp.id = $1
)
SELECT
  ay.year AS academic_year,
  COALESCE(reg.short_name, reg.name) AS regulation,
  aff.name AS affiliation,
  std.uid AS uid,
  u.name AS student_name,
  pc.name AS program_course,
  COALESCE(sh.name, '') AS shift,
  cl.name AS semester,
  COALESCE(std.class_roll_number::text, pr.roll_number::text, '') AS class_roll_no,
  COALESCE(sec.name, '') AS section,
  CASE
    WHEN u.is_suspended = true THEN 'SUSPENDED'
    WHEN std.has_cancelled_admission = true THEN 'CANCELLED_ADMISSION'
    WHEN std.taken_transfer_certificate = true THEN 'TC'
    WHEN std.alumni = true AND std.active = true THEN 'GRADUATED_WITH_SUPP'
    WHEN std.alumni = true AND std.active = false THEN 'COMPLETED_LEFT'
    WHEN std.active = false
         AND (std.leaving_date IS NOT NULL OR std.leaving_reason IS NOT NULL)
         THEN 'DROPPED_OUT'
    WHEN u.is_active = true THEN 'REGULAR'
    ELSE 'DROPPED_OUT'
  END AS user_status,
  COALESCE(std.registration_number::text, '') AS cu_reg_no,
  COALESCE(std.roll_number::text, '') AS cu_roll_no,
  COALESCE(pd.mobile_number::text, '') AS personal_contact,
  COALESCE(pd.emergency_residential_number::text, '') AS emergency_contact,
  COALESCE(pd.whatsapp_number::text, u.whatsapp_number::text, '') AS whatsapp_number,
  COALESCE(u.email::text, '') AS institutional_email,
  COALESCE(pd.email::text, pd.alternative_email::text, '') AS personal_email,
  COALESCE(std.community::text, '') AS community,
  COALESCE(rel.name::text, '') AS religion,
  COALESCE(pd.gender::text, '') AS gender,
  COALESCE(cat.name::text, '') AS category,
  std.id AS student_id,
  pr.promotion_id AS promotion_id
FROM students std
INNER JOIN users u ON u.id = std.user_id_fk
INNER JOIN promotions_in_year pr ON pr.student_id_fk = std.id
INNER JOIN program_courses pc ON pc.id = pr.program_course_id_fk
LEFT JOIN affiliations aff ON aff.id = pc.affiliation_id_fk
LEFT JOIN regulation_types reg ON reg.id = pc.regulation_type_id_fk
INNER JOIN sessions sess ON sess.id = pr.session_id_fk
INNER JOIN academic_years ay ON ay.id = sess.academic_id_fk
LEFT JOIN shifts sh ON sh.id = pr.shift_id_fk
INNER JOIN classes cl ON cl.id = pr.class_id_fk
LEFT JOIN sections sec ON sec.id = pr.section_id_fk
LEFT JOIN personal_details pd ON pd.user_id_fk = u.id
LEFT JOIN religion rel ON rel.id = pd.religion_id_fk
LEFT JOIN categories cat ON cat.id = pd.category_id_fk
WHERE ay.id = $1
${rosterFilters}
ORDER BY pc.name, cl.name, u.name, pr.promotion_id
`;
  return { text, values: [academicYearId] as unknown[] };
}

function setEnrolmentMasterColumnWidths(sheet: ExcelJS.Worksheet): void {
  const widths = [
    14, 12, 22, 14, 28, 28, 10, 14, 12, 10, 14, 18, 18, 36, 16, 14, 16, 14, 28,
    28, 12, 14, 10, 14,
  ];
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
}

/**
 * Paper rows + roster are loaded in parallel (two simpler plans).
 * Excel: batched rows, header-only styling (full grid on huge sheets is O(rows×cols) in JS).
 */
export async function exportEnrolmentMasterReportBuffer(
  academicYearId: number,
  filters: ReportExportFilters,
): Promise<Buffer> {
  const paperBundle = buildStudentSubjectsExportSql(
    academicYearId,
    filters,
    "paperRows",
  );
  const rosterBundle = buildStudentRosterSql(academicYearId, filters);

  const [paperResult, rosterResult] = await Promise.all([
    pool.query(paperBundle.text, paperBundle.values),
    pool.query(rosterBundle.text, rosterBundle.values),
  ]);

  const papersByStudentPromotion = buildPapersByStudentPromotion(
    paperResult.rows as {
      student_id: number;
      promotion_id: number;
      paper: string;
      paper_code: string;
    }[],
  );

  const studentRows = rosterResult.rows as Record<string, unknown>[];

  const headerRow: ExcelJS.CellValue[] = [
    "Academic Year",
    "Regulation",
    "Affiliation",
    "UID",
    "Student Name",
    "Program Course",
    "Shift",
    "Semester",
    "Class Roll No.",
    "Section",
    "User Status",
    "CU Reg No.",
    "CU Roll No.",
    "Subject / Paper",
    "Paper code",
    "Personal Contact",
    "Emergency Contact",
    "WhatsApp",
    "Institutional Email",
    "Personal Email",
    "Community",
    "Religion",
    "Gender",
    "Category",
  ];

  const baseCols = (row: Record<string, unknown>) => [
    row.academic_year,
    row.regulation,
    row.affiliation,
    row.uid,
    row.student_name,
    row.program_course,
    row.shift,
    row.semester,
    row.class_roll_no,
    row.section,
    row.user_status,
    row.cu_reg_no,
    row.cu_roll_no,
  ];
  const tailCols = (row: Record<string, unknown>) => [
    row.personal_contact,
    row.emergency_contact,
    row.whatsapp_number,
    row.institutional_email,
    row.personal_email,
    row.community,
    row.religion,
    row.gender,
    row.category,
  ];

  const dataRows: ExcelJS.CellValue[][] = [];
  for (const row of studentRows) {
    const sid = row.student_id as number;
    const pid = row.promotion_id as number;
    const papers = papersByStudentPromotion.get(`${sid}:${pid}`);
    if (!papers?.length) {
      dataRows.push([
        ...(baseCols(row) as ExcelJS.CellValue[]),
        "",
        "",
        ...(tailCols(row) as ExcelJS.CellValue[]),
      ]);
      continue;
    }
    for (const { paper, paper_code } of papers) {
      dataRows.push([
        ...(baseCols(row) as ExcelJS.CellValue[]),
        paper,
        paper_code,
        ...(tailCols(row) as ExcelJS.CellValue[]),
      ]);
    }
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("enrolment-master");
  sheet.addRow(headerRow);
  sheet.addRows(dataRows);

  setEnrolmentMasterColumnWidths(sheet);
  applyReportHeaderAndFreezeOnly(sheet);

  const buf = await workbook.xlsx.writeBuffer({ useSharedStrings: false });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}
