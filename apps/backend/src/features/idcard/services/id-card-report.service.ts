import { and, asc, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import ExcelJS from "exceljs";
import { createRequire } from "node:module";
// archiver ships a callable CJS default whose TS types declare a namespace —
// route through createRequire to keep the callable shape under ESM.
const archiverFactory = createRequire(import.meta.url)("archiver") as (
  format: "zip" | "tar",
  opts?: { zlib?: { level?: number } },
) => import("archiver").Archiver;
import { PassThrough } from "node:stream";

import { db } from "@/db/index.js";
import { getBufferFromS3 } from "@/services/s3.service.js";
import { applyStandardExcelReportTableStyling } from "@/utils/excel-report-styling.js";
import {
  academicYearModel,
  idCardIssueModel,
  idCardTemplateModel,
  personalDetailsModel,
  studentModel,
  userModel,
} from "@repo/db/schemas/index.js";

export async function listIssuanceDates(): Promise<string[]> {
  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${idCardIssueModel.issueDate}), 'YYYY-MM-DD')`,
    })
    .from(idCardIssueModel)
    .groupBy(sql`date_trunc('day', ${idCardIssueModel.issueDate})`)
    .orderBy(desc(sql`date_trunc('day', ${idCardIssueModel.issueDate})`));
  return rows.map((r) => r.date).filter(Boolean);
}

type ReportRow = {
  id: number;
  name: string | null;
  emergencyContact: string | null;
  academicYear: string | null;
  programCourse: string | null;
  uid: string | null;
  rfid: string | null;
  issueStatus: string;
  issuedAt: Date | null;
  validTill: string | null;
  remarks: string | null;
  shift: string | null;
  section: string | null;
  classRollNumber: string | null;
  bloodGroup: string | null;
  quotaType: string | null;
  issuedByUser: string | null;
  issuedUserType: string | null;
  issuedUserEmail: string | null;
  issuedUserPhone: string | null;
  frontImageKey: string | null;
};

export async function fetchIssuesForRange(
  from: string,
  to: string,
): Promise<ReportRow[]> {
  // The person who issued the card is a separate user from the student, so
  // join `users` a second time under an alias.
  const issuer = alias(userModel, "issuer");

  return db
    .select({
      id: idCardIssueModel.id,
      name: sql<
        string | null
      >`COALESCE(${idCardIssueModel.nameSnapshot}, ${userModel.name})`,
      // Emergency contact is primarily stored in the dedicated
      // `emergency_contacts` table (keyed by user); fall back to personal
      // details and finally the address row for older records.
      emergencyContact: sql<string | null>`COALESCE(
        (SELECT COALESCE(NULLIF(ec.phone, ''), NULLIF(ec.residential_phone, ''), NULLIF(ec.office_phone, ''))
         FROM emergency_contacts ec
         WHERE ec.user_id_fk = ${userModel.id}
         ORDER BY ec.id DESC LIMIT 1),
        NULLIF(${personalDetailsModel.emergencyResidentialNumber}, ''),
        (SELECT NULLIF(a.emergency_phone, '') FROM address a
         WHERE a.personal_details_id_fk = ${personalDetailsModel.id}
           AND NULLIF(a.emergency_phone, '') IS NOT NULL
         ORDER BY a.id LIMIT 1))`,
      // Academic year of the card's template; fall back to the student's
      // latest promotion session (legacy cards may not reference a template).
      academicYear: sql<string | null>`COALESCE(${academicYearModel.year}, (
        SELECT ay.year FROM promotions pr
        JOIN sessions sess ON sess.id = pr.session_id_fk
        JOIN academic_years ay ON ay.id = sess.academic_id_fk
        WHERE pr.student_id_fk = ${idCardIssueModel.studentId}
        ORDER BY pr.id DESC LIMIT 1))`,
      // Snapshot first (point-in-time); fall back to the student's latest
      // promotion (legacy-synced cards never captured these snapshots).
      programCourse: sql<
        string | null
      >`COALESCE(${idCardIssueModel.courseSnapshot}, (
        SELECT pc.name FROM promotions pr
        JOIN program_courses pc ON pc.id = pr.program_course_id_fk
        WHERE pr.student_id_fk = ${idCardIssueModel.studentId}
        ORDER BY pr.id DESC LIMIT 1))`,
      uid: sql<
        string | null
      >`COALESCE(${idCardIssueModel.uidSnapshot}, ${studentModel.uid})`,
      // Prefer the RFID captured on the card; fall back to the student's
      // current RFID so legacy-synced cards still show a value.
      rfid: sql<
        string | null
      >`COALESCE(${idCardIssueModel.rfidNumber}, ${studentModel.rfidNumber})`,
      issueStatus: idCardIssueModel.issueStatus,
      issuedAt: idCardIssueModel.issueDate,
      validTill: idCardIssueModel.validTill,
      remarks: idCardIssueModel.remarks,
      // No snapshot for shift — derive from the student's latest promotion.
      shift: sql<string | null>`(
        SELECT sh.name FROM promotions pr
        JOIN shifts sh ON sh.id = pr.shift_id_fk
        WHERE pr.student_id_fk = ${idCardIssueModel.studentId}
        ORDER BY pr.id DESC LIMIT 1)`,
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
      bloodGroup: idCardIssueModel.bloodGroupSnapshot,
      quotaType: idCardIssueModel.quotaTypeSnapshot,
      issuedByUser: issuer.name,
      issuedUserType: issuer.type,
      issuedUserEmail: issuer.email,
      issuedUserPhone: issuer.phone,
      frontImageKey: idCardIssueModel.frontImageKey,
    })
    .from(idCardIssueModel)
    .leftJoin(studentModel, eq(studentModel.id, idCardIssueModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, userModel.id),
    )
    .leftJoin(issuer, eq(issuer.id, idCardIssueModel.issuedByUserId))
    .leftJoin(
      idCardTemplateModel,
      eq(idCardTemplateModel.id, idCardIssueModel.templateId),
    )
    .leftJoin(
      academicYearModel,
      eq(academicYearModel.id, idCardTemplateModel.academicYearId),
    )
    .where(
      and(
        sql`date_trunc('day', ${idCardIssueModel.issueDate}) >= ${from}::date`,
        sql`date_trunc('day', ${idCardIssueModel.issueDate}) <= ${to}::date`,
      ),
    )
    .orderBy(asc(idCardIssueModel.createdAt));
}

export async function buildExcelReport(
  from: string,
  to: string,
): Promise<Buffer> {
  const rows = await fetchIssuesForRange(from, to);
  const wb = new ExcelJS.Workbook();
  wb.creator = "academic360";
  wb.created = new Date();
  const sheetLabel = from === to ? from : `${from} to ${to}`;
  const ws = wb.addWorksheet(`ID Cards ${sheetLabel}`);

  ws.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Name", key: "name", width: 30 },
    { header: "Emergency Contact", key: "emergencyContact", width: 22 },
    { header: "Academic Year", key: "academicYear", width: 14 },
    { header: "Program Course", key: "programCourse", width: 30 },
    { header: "UID", key: "uid", width: 18 },
    { header: "RFID", key: "rfid", width: 18 },
    { header: "Status", key: "issueStatus", width: 12 },
    { header: "Issued At", key: "issuedAt", width: 22 },
    { header: "Valid Till Date", key: "validTill", width: 16 },
    { header: "Remarks", key: "remarks", width: 30 },
    { header: "Shift", key: "shift", width: 14 },
    { header: "Section", key: "section", width: 12 },
    { header: "Class Roll No.", key: "classRollNumber", width: 14 },
    { header: "Blood Group", key: "bloodGroup", width: 12 },
    { header: "Quota Type", key: "quotaType", width: 16 },
    { header: "Issued By User", key: "issuedByUser", width: 24 },
    { header: "Issued User Type", key: "issuedUserType", width: 16 },
    { header: "Issued User Email", key: "issuedUserEmail", width: 30 },
    { header: "Issued User Phone", key: "issuedUserPhone", width: 18 },
  ];
  rows.forEach((r) => {
    ws.addRow({
      ...r,
      issuedAt: r.issuedAt
        ? new Date(r.issuedAt).toISOString().replace("T", " ").slice(0, 19)
        : "",
    });
  });

  // Grey header fill + grid borders + frozen header — same as the other exports.
  applyStandardExcelReportTableStyling(ws);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function streamZipForRange(from: string, to: string) {
  const archive = archiverFactory("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();
  archive.pipe(stream);

  (async () => {
    const rows = await fetchIssuesForRange(from, to);
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
      const rangeLabel = from === to ? from : `${from} to ${to}`;
      archive.append(`No ID cards issued for ${rangeLabel}.`, {
        name: "README.txt",
      });
    }
    await archive.finalize();
  })().catch((err) => {
    stream.emit("error", err);
  });

  return stream;
}
