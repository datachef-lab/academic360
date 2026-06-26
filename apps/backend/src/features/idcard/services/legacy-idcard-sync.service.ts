import { eq } from "drizzle-orm";

import { db, mysqlConnection } from "@/db/index.js";
import { idCardIssueModel, studentModel } from "@repo/db/schemas/index.js";
import { fileExistsInS3, uploadToS3 } from "@/services/s3.service.js";

/**
 * ONE-TIME legacy ID card backfill (snapcard → new DB + S3).
 *
 * Runs in the background on backend startup, ONLY when `IDCARD_LEGACY_SYNC=true`.
 * It is idempotent (keyed on `legacyIssueId`) and resumable, so it is safe to
 * leave enabled across restarts. Remove this once the one-time load is done and
 * the snapcard EC2 (`13.235.168.107` / `bescid.academic360.app`) is decommissioned.
 *
 * Source mapping (user-confirmed):
 *   old id_card_issues.student_id_fk = studentpersonaldetails.id
 *   new students.legacy_student_id   = studentpersonaldetails.id  → student lookup
 *   new students.uid                 = studentpersonaldetails.codeNumber → image URL
 */

type OldIdCardRow = {
  id: number;
  student_id_fk: number;
  issue_date: string | Date | null;
  expiry_date: string | Date | null;
  issue_status: "ISSUED" | "RENEWED" | "REISSUED";
  renewed_from_id: number | null;
  remarks: string | null;
  name: string | null;
  sports_quota: string | null;
  phone_mobile_no: string | null;
  blood_group_name: string | null;
  course_name: string | null;
  created_at: string | Date;
  updated_at: string | Date | null;
};

const DEDUP_WINDOW_MS = 15_000;
const IMAGE_BASE_URL =
  process.env.IDCARD_LEGACY_IMAGE_URL ||
  "https://bescid.academic360.app/id-card-generate/api/images";

const ts = (v: string | Date | null | undefined): number =>
  v ? new Date(v).getTime() : 0;

const toDateOnly = (v: string | Date | null | undefined): string | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export type LegacyIdCardSyncSummary = {
  scanned: number;
  deduped: number;
  inserted: number;
  alreadyMigrated: number;
  missingStudent: number;
  imageFetched: number;
  imageSkipped: number;
  errors: number;
};

/**
 * @param opts.force run even when IDCARD_LEGACY_SYNC is not "true" (manual API trigger).
 *        The duplicate guard (legacyIssueId) still prevents re-inserts.
 */
export async function syncLegacyIdCards(opts?: {
  force?: boolean;
}): Promise<LegacyIdCardSyncSummary | { skipped: true }> {
  if (!opts?.force && process.env.IDCARD_LEGACY_SYNC !== "true") {
    return { skipped: true };
  }

  const summary = {
    scanned: 0,
    deduped: 0,
    inserted: 0,
    alreadyMigrated: 0,
    missingStudent: 0,
    imageFetched: 0,
    imageSkipped: 0,
    errors: 0,
  };

  try {
    console.log("[idcard-sync] starting legacy ID card backfill…");
    const [rows] = (await mysqlConnection.query(
      "SELECT * FROM id_card_issues ORDER BY student_id_fk, created_at, id",
    )) as [OldIdCardRow[], unknown];
    summary.scanned = rows.length;

    // --- Dedup: per student, collapse consecutive same-status rows within 15s, keep latest.
    const keptRows: OldIdCardRow[] = [];
    const oldToKeptId = new Map<number, number>(); // any old id → surviving old id
    const byStudent = new Map<number, OldIdCardRow[]>();
    for (const r of rows) {
      const arr = byStudent.get(r.student_id_fk) ?? [];
      arr.push(r);
      byStudent.set(r.student_id_fk, arr);
    }
    for (const arr of byStudent.values()) {
      arr.sort((a, b) => ts(a.created_at) - ts(b.created_at) || a.id - b.id);
      let cluster: OldIdCardRow[] = [];
      const flush = () => {
        if (!cluster.length) return;
        const keep = cluster[cluster.length - 1]!; // latest in the burst
        keptRows.push(keep);
        for (const c of cluster) oldToKeptId.set(c.id, keep.id);
        cluster = [];
      };
      for (const r of arr) {
        const last = cluster[cluster.length - 1];
        if (
          last &&
          last.issue_status === r.issue_status &&
          ts(r.created_at) - ts(last.created_at) <= DEDUP_WINDOW_MS
        ) {
          cluster.push(r);
        } else {
          flush();
          cluster.push(r);
        }
      }
      flush();
    }
    summary.deduped = rows.length - keptRows.length;

    // Insert oldest-first so a RENEWED row's parent already has a new id.
    keptRows.sort((a, b) => ts(a.created_at) - ts(b.created_at) || a.id - b.id);

    const studentCache = new Map<number, { id: number; uid: string } | null>();
    const getStudent = async (legacyStudentId: number) => {
      if (studentCache.has(legacyStudentId))
        return studentCache.get(legacyStudentId)!;
      const [s] = await db
        .select({ id: studentModel.id, uid: studentModel.uid })
        .from(studentModel)
        .where(eq(studentModel.legacyStudentId, legacyStudentId));
      const v = s ?? null;
      studentCache.set(legacyStudentId, v);
      return v;
    };

    // One image per uid (the student's current card), uploaded once to S3.
    const uidImageKey = new Map<string, string | null>();
    const ensureImage = async (uid: string): Promise<string | null> => {
      if (uidImageKey.has(uid)) return uidImageKey.get(uid)!;
      const key = `idcard/legacy/${uid}.png`;
      try {
        if (await fileExistsInS3(key)) {
          summary.imageSkipped++;
          uidImageKey.set(uid, key);
          return key;
        }
        const res = await fetch(
          `${IMAGE_BASE_URL}?crop=true&uid=${encodeURIComponent(uid)}`,
        );
        if (!res.ok) {
          uidImageKey.set(uid, null);
          return null;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (!buf.length) {
          uidImageKey.set(uid, null);
          return null;
        }
        await uploadToS3(
          {
            buffer: buf,
            originalname: `${uid}.png`,
            mimetype: "image/png",
          } as unknown as Express.Multer.File,
          {
            folder: "idcard/legacy",
            customFileName: `${uid}.png`,
            contentType: "image/png",
          },
        );
        summary.imageFetched++;
        uidImageKey.set(uid, key);
        return key;
      } catch {
        uidImageKey.set(uid, null);
        return null;
      }
    };

    const keptOldToNewId = new Map<number, number>(); // surviving old id → new id

    for (const r of keptRows) {
      try {
        const [existing] = await db
          .select({ id: idCardIssueModel.id })
          .from(idCardIssueModel)
          .where(eq(idCardIssueModel.legacyIssueId, r.id));
        if (existing) {
          keptOldToNewId.set(r.id, existing.id);
          summary.alreadyMigrated++;
          continue;
        }

        const student = await getStudent(r.student_id_fk);
        if (!student) {
          summary.missingStudent++;
          continue;
        }

        const parentKeptOld =
          r.renewed_from_id != null
            ? oldToKeptId.get(r.renewed_from_id)
            : undefined;
        const renewedFromNew =
          parentKeptOld != null ? keptOldToNewId.get(parentKeptOld) : undefined;

        const frontImageKey = await ensureImage(student.uid);

        const [inserted] = await db
          .insert(idCardIssueModel)
          .values({
            legacyIssueId: r.id,
            studentId: student.id,
            issueStatus: r.issue_status,
            renewedFromIssueId: renewedFromNew ?? null,
            issueDate: new Date(r.created_at),
            validTill: toDateOnly(r.expiry_date),
            frontImageKey: frontImageKey ?? undefined,
            nameSnapshot: r.name ?? undefined,
            courseSnapshot: r.course_name ?? undefined,
            bloodGroupSnapshot: r.blood_group_name ?? undefined,
            mobileSnapshot: r.phone_mobile_no ?? undefined,
            sportsQuotaSnapshot: r.sports_quota ?? undefined,
            uidSnapshot: student.uid,
            remarks: r.remarks ?? undefined,
          })
          .returning({ id: idCardIssueModel.id });

        keptOldToNewId.set(r.id, inserted!.id);
        summary.inserted++;
      } catch (e) {
        summary.errors++;
        console.error(
          `[idcard-sync] row ${r.id} failed:`,
          (e as Error)?.message,
        );
      }
    }

    console.log("[idcard-sync] done:", JSON.stringify(summary));
    return summary;
  } catch (e) {
    console.error("[idcard-sync] fatal:", (e as Error)?.message);
    return summary;
  }
}
