import { and, asc, desc, eq, sql } from "drizzle-orm";
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
      ),
    )
    .orderBy(asc(idCardIssueModel.createdAt));
}

export async function buildExcelReport(date: string): Promise<Buffer> {
  const rows = await fetchIssuesForDate(date);
  const wb = new ExcelJS.Workbook();
  wb.creator = "academic360";
  wb.created = new Date();
  const ws = wb.addWorksheet(`ID Cards ${date}`);

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
  rows.forEach((r) => {
    ws.addRow({
      ...r,
      createdAt: r.createdAt
        ? new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 19)
        : "",
    });
  });

  // Grey header fill + grid borders + frozen header — same as the other exports.
  applyStandardExcelReportTableStyling(ws);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
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
