import { and, asc, desc, eq, sql } from "drizzle-orm";
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
