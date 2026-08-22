import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { createRequire } from "node:module";
// archiver ships a callable CJS default whose TS types declare a namespace —
// route through createRequire to keep the callable shape under ESM.
const archiverFactory = createRequire(import.meta.url)("archiver") as (
  format: "zip" | "tar",
  opts?: { zlib?: { level?: number } },
) => import("archiver").Archiver;
import { PassThrough, Writable } from "node:stream";

import { db } from "@/db/index.js";
import { getBufferFromS3 } from "@/services/s3.service.js";
import {
  styleStreamedBodyRow,
  styleStreamedHeaderRow,
} from "@/utils/excel-report-styling.js";
import {
  idCardIssueModel,
  studentModel,
  userModel,
} from "@repo/db/schemas/index.js";

export async function listIssuanceDates(): Promise<string[]> {
  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${idCardIssueModel.issueDate}), 'YYYY-MM-DD')`,
    })
    .from(idCardIssueModel)
    .where(ne(idCardIssueModel.issueStatus, "DRAFT"))
    .groupBy(sql`date_trunc('day', ${idCardIssueModel.issueDate})`)
    .orderBy(desc(sql`date_trunc('day', ${idCardIssueModel.issueDate})`));
  return rows.map((r) => r.date).filter(Boolean);
}

type ReportRow = {
  id: number;
  uid: string | null;
  name: string | null;
  phone: string | null;
  bloodGroup: string | null;
  course: string | null;
  section: string | null;
  classRollNumber: string | null;
  validTill: string | null;
  issueStatus: string;
  remarks: string | null;
  createdAt: Date;
  frontImageKey: string | null;
};

export async function fetchIssuesForDate(date: string): Promise<ReportRow[]> {
  return db
    .select({
      id: idCardIssueModel.id,
      uid: idCardIssueModel.uidSnapshot,
      name: idCardIssueModel.nameSnapshot,
      phone: idCardIssueModel.mobileSnapshot,
      bloodGroup: idCardIssueModel.bloodGroupSnapshot,
      course: idCardIssueModel.courseSnapshot,
      // Snapshot first (point-in-time); fall back to the student's latest
      // promotion (legacy-synced cards never captured these snapshots).
      section: sql<
        string | null
      >`COALESCE(${idCardIssueModel.sectionSnapshot}, (
        SELECT sec.name FROM promotions pr
        JOIN sections sec ON sec.id = pr.section_id_fk
        WHERE pr.student_id_fk = ${idCardIssueModel.studentId}
        ORDER BY pr.id DESC LIMIT 1))`,
      classRollNumber: sql<
        string | null
      >`COALESCE(${idCardIssueModel.classRollNumberSnapshot}, ${studentModel.classRollNumber}, (
        SELECT pr.class_roll_number FROM promotions pr
        WHERE pr.student_id_fk = ${idCardIssueModel.studentId}
        ORDER BY pr.id DESC LIMIT 1))`,
      validTill: idCardIssueModel.validTill,
      issueStatus: idCardIssueModel.issueStatus,
      remarks: idCardIssueModel.remarks,
      createdAt: idCardIssueModel.createdAt,
      frontImageKey: idCardIssueModel.frontImageKey,
    })
    .from(idCardIssueModel)
    .leftJoin(studentModel, eq(studentModel.id, idCardIssueModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .where(
      and(
        sql`date_trunc('day', ${idCardIssueModel.issueDate}) = ${date}::date`,
        ne(idCardIssueModel.issueStatus, "DRAFT"),
      ),
    )
    .orderBy(asc(idCardIssueModel.createdAt));
}

/**
 * Same query as `fetchIssuesForDate`, but keyset-paginated in `(createdAt,
 * id)` chunks — `id` is added purely as a deterministic tiebreaker for
 * pagination (the original single-shot query had no secondary sort, so ties
 * on `createdAt` were already DB-plan-dependent; adding `id` only makes that
 * previously-unspecified ordering stable, it doesn't change which rows or
 * values come back).
 */
async function fetchIssuesForDateChunk(
  date: string,
  cursor: { createdAt: Date; id: number } | null,
  limit: number,
): Promise<ReportRow[]> {
  const conditions = [
    sql`date_trunc('day', ${idCardIssueModel.issueDate}) = ${date}::date`,
    ne(idCardIssueModel.issueStatus, "DRAFT"),
  ];
  if (cursor) {
    conditions.push(
      sql`(${idCardIssueModel.createdAt}, ${idCardIssueModel.id}) > (${cursor.createdAt.toISOString()}::timestamptz, ${cursor.id})`,
    );
  }

  return db
    .select({
      id: idCardIssueModel.id,
      uid: idCardIssueModel.uidSnapshot,
      name: idCardIssueModel.nameSnapshot,
      phone: idCardIssueModel.mobileSnapshot,
      bloodGroup: idCardIssueModel.bloodGroupSnapshot,
      course: idCardIssueModel.courseSnapshot,
      section: sql<
        string | null
      >`COALESCE(${idCardIssueModel.sectionSnapshot}, (
        SELECT sec.name FROM promotions pr
        JOIN sections sec ON sec.id = pr.section_id_fk
        WHERE pr.student_id_fk = ${idCardIssueModel.studentId}
        ORDER BY pr.id DESC LIMIT 1))`,
      classRollNumber: sql<
        string | null
      >`COALESCE(${idCardIssueModel.classRollNumberSnapshot}, ${studentModel.classRollNumber}, (
        SELECT pr.class_roll_number FROM promotions pr
        WHERE pr.student_id_fk = ${idCardIssueModel.studentId}
        ORDER BY pr.id DESC LIMIT 1))`,
      validTill: idCardIssueModel.validTill,
      issueStatus: idCardIssueModel.issueStatus,
      remarks: idCardIssueModel.remarks,
      createdAt: idCardIssueModel.createdAt,
      frontImageKey: idCardIssueModel.frontImageKey,
    })
    .from(idCardIssueModel)
    .leftJoin(studentModel, eq(studentModel.id, idCardIssueModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .where(and(...conditions))
    .orderBy(asc(idCardIssueModel.createdAt), asc(idCardIssueModel.id))
    .limit(limit);
}

/**
 * Streams the day's ID-card issuance report directly to `res` instead of
 * building the workbook fully in memory — rows are pulled from the DB in
 * fixed-size chunks (see `fetchIssuesForDateChunk`) and written as they
 * arrive.
 */
export async function buildExcelReport(
  date: string,
  // A plain `NodeJS.WritableStream` rather than Express's `Response` — this
  // is all ExcelJS's `WorkbookWriter` needs (it's just handed through as
  // `{ stream }`), and it lets the report-job queue in
  // reports/report-generators.ts reuse this streaming path via a
  // `PassThrough` to still get a `Buffer` back for its job-storage
  // contract, instead of duplicating this function for that caller.
  res: Writable,
): Promise<void> {
  const CHUNK_SIZE = 2000;

  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: true,
  });
  wb.creator = "academic360";
  wb.created = new Date();
  const ws = wb.addWorksheet(`ID Cards ${date}`, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "UID", key: "uid", width: 18 },
    { header: "Name", key: "name", width: 30 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Blood Group", key: "bloodGroup", width: 12 },
    { header: "Course", key: "course", width: 30 },
    { header: "Section", key: "section", width: 12 },
    { header: "Class Roll No.", key: "classRollNumber", width: 14 },
    { header: "Valid Till", key: "validTill", width: 14 },
    { header: "Status", key: "issueStatus", width: 12 },
    { header: "Remarks", key: "remarks", width: 30 },
    { header: "Created At", key: "createdAt", width: 22 },
  ];
  styleStreamedHeaderRow(ws.getRow(1));
  ws.getRow(1).commit();

  let cursor: { createdAt: Date; id: number } | null = null;
  for (;;) {
    const chunk = await fetchIssuesForDateChunk(date, cursor, CHUNK_SIZE);
    if (chunk.length === 0) break;

    for (const r of chunk) {
      const dataRow = ws.addRow({
        ...r,
        createdAt: r.createdAt
          ? new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 19)
          : "",
      });
      styleStreamedBodyRow(dataRow);
      dataRow.commit();
    }

    if (chunk.length < CHUNK_SIZE) break;
    const last = chunk[chunk.length - 1];
    cursor = { createdAt: last.createdAt, id: last.id };
  }

  ws.commit();
  await wb.commit();
}

type AuditRow = {
  student_name: string | null;
  uid: string | null;
  academic_year: string | null;
  program_course: string | null;
  semester: string | null;
  shift: string | null;
  section: string | null;
  is_legacy: boolean | null;
  is_inactive: boolean | null;
  rfid_in_use: string | null;
  issued_type: string | null;
  issued_by: string | null;
  issued_at: string | null;
  printed_by: string | null;
  printed_at: string | null;
  rfid_list: (string | null)[] | null;
};

/** WHERE fragment limiting issues to the given date range (either bound optional). */
const auditDateFilter = (from?: string, to?: string) =>
  from && to
    ? sql`AND i.issue_date::date BETWEEN ${from}::date AND ${to}::date`
    : from
      ? sql`AND i.issue_date::date >= ${from}::date`
      : to
        ? sql`AND i.issue_date::date <= ${to}::date`
        : sql``;

/** "RFID Latest", "RFID 2nd Latest", "RFID 3rd Latest", "RFID 4th Latest", … */
const rfidColumnHeader = (n: number): string => {
  if (n === 1) return "RFID Latest";
  const tens = n % 100;
  const suffix =
    tens >= 11 && tens <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";
  return `RFID ${n}${suffix} Latest`;
};

const stripSemester = (name: string | null): string => {
  if (!name) return "";
  const out = String(name)
    .replace(/semester/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return out || String(name);
};

/**
 * ID-card audit report over an issue-date range. Mirrors the read-only audit in
 * decisions/0043 (per-student: latest promotion → academic year / program course
 * / semester / shift / section, latest issue → type + issuer + legacy flag, its
 * RFID picture: "RFID In Use" = the RFID currently set on the student record, then
 * one "RFID Latest / 2nd Latest / …" column per issue, latest-first — an entry
 * with no RFID (a DRAFT, or legacy data) shows "N/A", positions past a student's
 * entry count stay blank, and the column count grows to the DB-wide max issues for
 * any single student). Streams the styled workbook to `res`. DRAFT rows are
 * included; inactive students' rows are shaded a strong red.
 */
export async function buildAuditReport(
  fromDate: string | undefined,
  toDate: string | undefined,
  res: Writable,
): Promise<void> {
  const dateFilter = auditDateFilter(fromDate, toDate);
  const { rows: raw } = await db.execute(sql`
    WITH pop AS (
      SELECT DISTINCT i.student_id_fk AS id
      FROM id_card_issues i
      WHERE true
        ${dateFilter}
    ),
    li AS (
      -- Latest entry per student INCLUDING drafts, so printed_at / printed_by and
      -- the shown type reflect the most recent id-card action.
      SELECT DISTINCT ON (i.student_id_fk) i.student_id_fk, i.issue_status,
             i.issue_date, i.issued_by_user_id_fk, i.legacy_issue_id,
             i.printed_at, i.printed_by_user_id_fk, i.rfid_number
      FROM id_card_issues i JOIN pop ON pop.id = i.student_id_fk
      ORDER BY i.student_id_fk, i.issue_date DESC, i.id DESC
    ),
    lp AS (
      SELECT DISTINCT ON (p.student_id_fk) p.student_id_fk, ay.year AS academic_year,
             COALESCE(pc.short_name, pc.name) AS program_course,
             cl.name AS semester, sh.name AS shift, sec.name AS section
      FROM promotions p JOIN pop ON pop.id = p.student_id_fk
      LEFT JOIN sessions se ON se.id = p.session_id_fk
      LEFT JOIN academic_years ay ON ay.id = se.academic_id_fk
      LEFT JOIN program_courses pc ON pc.id = p.program_course_id_fk
      LEFT JOIN classes cl ON cl.id = p.class_id_fk
      LEFT JOIN shifts sh ON sh.id = p.shift_id_fk
      LEFT JOIN sections sec ON sec.id = p.section_id_fk
      ORDER BY p.student_id_fk, p.id DESC
    ),
    rf AS (
      -- Every issue (drafts included), oldest→latest; NULL rfid is kept so the
      -- report can distinguish "entry exists, no rfid" (N/A) from "no entry" (blank).
      SELECT i.student_id_fk,
             json_agg(i.rfid_number ORDER BY i.issue_date ASC, i.id ASC) AS rfid_list
      FROM id_card_issues i JOIN pop ON pop.id = i.student_id_fk
      GROUP BY i.student_id_fk
    )
    SELECT u.name AS student_name, s.uid, lp.academic_year, lp.program_course,
           lp.semester, lp.shift, lp.section,
           (li.legacy_issue_id IS NOT NULL) AS is_legacy,
           (COALESCE(u.is_active, true) = false OR COALESCE(u.is_suspended, false) = true) AS is_inactive,
           s.rfid_number AS rfid_in_use,
           li.issue_status AS issued_type,
           CASE WHEN li.issue_status = 'DRAFT' THEN NULL ELSE ub.name END AS issued_by,
           CASE WHEN li.issue_status = 'DRAFT' THEN NULL
                ELSE to_char(li.issue_date, 'DD/MM/YYYY, HH12:MI AM') END AS issued_at,
           up.name AS printed_by,
           to_char(li.printed_at, 'DD/MM/YYYY, HH12:MI AM') AS printed_at,
           rf.rfid_list
    FROM pop
    JOIN students s ON s.id = pop.id
    LEFT JOIN users u ON u.id = s.user_id_fk
    LEFT JOIN li ON li.student_id_fk = pop.id
    LEFT JOIN users ub ON ub.id = li.issued_by_user_id_fk
    LEFT JOIN users up ON up.id = li.printed_by_user_id_fk
    LEFT JOIN lp ON lp.student_id_fk = pop.id
    LEFT JOIN rf ON rf.student_id_fk = pop.id
    ORDER BY li.issue_date DESC NULLS LAST, s.uid
  `);
  const rows = raw as AuditRow[];

  // Per student, one cell per ID-card entry, latest-first. "RFID Latest" is the
  // latest issue, "RFID 2nd Latest" the one before it, etc. An entry that exists
  // but has no RFID (a DRAFT, or legacy data) shows "N/A"; positions past a
  // student's entry count are left blank.
  const rfidLists = rows.map((r) =>
    (Array.isArray(r.rfid_list) ? r.rfid_list : [])
      .slice()
      .reverse() // stored oldest→latest; show latest-first
      .map((v) =>
        v != null && String(v).trim() !== "" ? String(v).trim() : "N/A",
      ),
  );
  // One "RFID N" column per entry; count = DB-wide max number of issues per student.
  const globalMax = rfidLists.reduce((m, o) => Math.max(m, o.length), 0);

  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: true,
  });
  wb.creator = "academic360";
  wb.created = new Date();
  const ws = wb.addWorksheet("ID Card Audit", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const columns = [
    { header: "Sr No.", key: "sr", width: 7 },
    { header: "Student", key: "student", width: 30 },
    { header: "UID", key: "uid", width: 16 },
    { header: "Academic Year", key: "academicYear", width: 14 },
    { header: "Program Course", key: "programCourse", width: 30 },
    { header: "Semester", key: "semester", width: 12 },
    { header: "Shift", key: "shift", width: 12 },
    { header: "Section", key: "section", width: 12 },
    { header: "From Old Legacy System", key: "isLegacy", width: 22 },
    { header: "RFID In Use", key: "rfidInUse", width: 18 },
    { header: "Issued Type", key: "issuedType", width: 12 },
    { header: "Issued By", key: "issuedBy", width: 22 },
    { header: "Issued At", key: "issuedAt", width: 22 },
    { header: "Printed By", key: "printedBy", width: 22 },
    { header: "Printed At", key: "printedAt", width: 22 },
  ];
  // Finalized RFID history, latest-first: "RFID Latest", "RFID 2nd Latest", …
  for (let s = 1; s <= globalMax; s++) {
    columns.push({ header: rfidColumnHeader(s), key: `rfid_${s}`, width: 18 });
  }
  ws.columns = columns;
  styleStreamedHeaderRow(ws.getRow(1));
  ws.getRow(1).commit();

  rows.forEach((r, idx) => {
    const rfids = rfidLists[idx] ?? [];
    const rowObj: Record<string, string | number> = {
      sr: idx + 1,
      student: r.student_name ?? "",
      uid: r.uid ?? "",
      academicYear: r.academic_year ?? "",
      programCourse: r.program_course ?? "",
      semester: stripSemester(r.semester),
      shift: r.shift ?? "",
      section: r.section ?? "",
      isLegacy: r.is_legacy ? "Yes" : "No",
      rfidInUse: r.rfid_in_use ?? "",
      issuedType: r.issued_type ?? "",
      issuedBy: r.issued_by ?? "",
      issuedAt: r.issued_at ?? "",
      printedBy: r.printed_by ?? "",
      printedAt: r.printed_at ?? "",
    };
    for (let s = 1; s <= globalMax; s++) {
      rowObj[`rfid_${s}`] = s <= rfids.length ? rfids[s - 1] : "";
    }
    const dataRow = ws.addRow(rowObj);
    styleStreamedBodyRow(dataRow);
    if (r.is_inactive) {
      for (let c = 1; c <= ws.columnCount; c++) {
        const cell = dataRow.getCell(c);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF5A5A" }, // strong red so inactive students stand out
        };
        cell.font = {
          ...(cell.font ?? {}),
          color: { argb: "FF7A0000" },
          bold: true,
        };
      }
    }
    dataRow.commit();
  });

  ws.commit();
  await wb.commit();
}

/**
 * ZIP of the latest issued card's front image per student in the audit
 * population (optional date range), each named `<rfid>.<ext>` — falling back to
 * the student's rfid, then UID, then issue id when a card has no RFID. DRAFTs
 * excluded; duplicate names are de-duplicated with a numeric suffix.
 */
export function streamAuditZip(fromDate?: string, toDate?: string) {
  const dateFilter = auditDateFilter(fromDate, toDate);
  const archive = archiverFactory("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();
  archive.pipe(stream);

  (async () => {
    const { rows: raw } = await db.execute(sql`
      SELECT DISTINCT ON (i.student_id_fk)
             i.id, i.front_image_key,
             COALESCE(NULLIF(i.rfid_number, ''), NULLIF(s.rfid_number, ''), s.uid, 'id-' || i.id::text) AS label
      FROM id_card_issues i
      JOIN students s ON s.id = i.student_id_fk
      WHERE true
        ${dateFilter}
      ORDER BY i.student_id_fk, i.issue_date DESC, i.id DESC
    `);
    const rows = raw as {
      id: number;
      front_image_key: string | null;
      label: string;
    }[];
    let added = 0;
    const usedNames = new Set<string>();
    for (const r of rows) {
      if (!r.front_image_key) continue;
      try {
        const buf = await getBufferFromS3(r.front_image_key);
        if (!buf) continue;
        const ext = (r.front_image_key.split(".").pop() || "png").toLowerCase();
        const base = String(r.label).replace(/[\\/:*?"<>|]/g, "_");
        let name = `${base}.${ext}`;
        let n = 2;
        while (usedNames.has(name)) name = `${base}-${n++}.${ext}`;
        usedNames.add(name);
        archive.append(buf, { name });
        added++;
      } catch {
        /* skip images missing in this environment */
      }
    }
    if (added === 0) {
      archive.append("No ID card images found for the selected range.", {
        name: "README.txt",
      });
    }
    await archive.finalize();
  })().catch((err) => {
    stream.emit("error", err);
  });

  return stream;
}

export function streamZipForDate(date: string) {
  const archive = archiverFactory("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();
  archive.pipe(stream);

  (async () => {
    const rows = await fetchIssuesForDate(date);
    let added = 0;
    for (const r of rows) {
      if (!r.frontImageKey) continue;
      try {
        const buf = await getBufferFromS3(r.frontImageKey);
        if (!buf) {
          archive.append(`Missing image for issue ${r.id}.`, {
            name: `errors/${r.id}.txt`,
          });
          continue;
        }
        const filename = `${r.uid ?? `id-${r.id}`}.png`.replace(
          /[\\/:*?"<>|]/g,
          "_",
        );
        archive.append(buf, { name: filename });
        added++;
      } catch (err) {
        archive.append(`Could not load image for issue ${r.id}: ${err}`, {
          name: `errors/${r.id}.txt`,
        });
      }
    }
    if (added === 0) {
      archive.append(`No ID cards issued on ${date}.`, { name: "README.txt" });
    }
    await archive.finalize();
  })().catch((err) => {
    stream.emit("error", err);
  });

  return stream;
}
