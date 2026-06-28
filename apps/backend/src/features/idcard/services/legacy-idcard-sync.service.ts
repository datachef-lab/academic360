import { eq } from "drizzle-orm";

import { db, mysqlConnection } from "@/db/index.js";
import { idCardIssueModel, studentModel } from "@repo/db/schemas/index.js";
import { fileExistsInS3, uploadToS3 } from "@/services/s3.service.js";

/**
 * Legacy ID card backfill (snapcard → new DB + S3).
 *
 * Runs in the background on every backend startup. It is idempotent (entries
 * keyed on `legacyIssueId`, images skipped when already in S3) and resumable, so
 * it self-heals on each restart and only fills gaps. Drop the startup call once
 * the one-time load is done and the snapcard EC2 (`13.235.168.107` /
 * `bescid.academic360.app`) is decommissioned.
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

// Guards against overlapping runs (the startup backfill + the manual trigger, or
// rapid restarts). The work itself is idempotent — already-migrated entries (by
// legacy_issue_id) and already-uploaded images (S3 existence) are skipped — so a
// re-run only fills gaps.
let syncRunning = false;

export async function syncLegacyIdCards(): Promise<
  LegacyIdCardSyncSummary | { skipped: true }
> {
  if (syncRunning) {
    return { skipped: true };
  }
  syncRunning = true;

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

    // --- Dedup: per student, collapse same-status rows issued on the SAME DAY,
    // keep the latest. The old DB has erroneous double entries (the same card
    // saved several times minutes apart); a real reissue/renewal is a different
    // status or a different day, so it is preserved.
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
      // group by day + issue_status; arr is ascending so the last row of each
      // group is the latest (collapses same-status same-day double entries).
      const groups = new Map<string, OldIdCardRow[]>(); // "day|status" -> rows
      for (const r of arr) {
        const day = toDateOnly(r.created_at) ?? String(ts(r.created_at));
        const key = `${day}|${r.issue_status}`;
        const g = groups.get(key);
        if (g) g.push(r);
        else groups.set(key, [r]);
      }
      // a real reissue is a different DAY; a REISSUED on the same day as an
      // ISSUED is a mis-tagged duplicate of that issuance -> fold it in.
      const issuedByDay = new Map<string, OldIdCardRow>();
      for (const [key, g] of groups) {
        const [day, status] = key.split("|");
        if (status === "ISSUED") issuedByDay.set(day!, g[g.length - 1]!);
      }
      for (const [key, g] of groups) {
        const [day, status] = key.split("|");
        const latest = g[g.length - 1]!;
        if (status === "REISSUED" && issuedByDay.has(day!)) {
          const issued = issuedByDay.get(day!)!;
          for (const c of g) oldToKeptId.set(c.id, issued.id);
          continue; // drop the same-day reissue duplicate
        }
        keptRows.push(latest);
        for (const c of g) oldToKeptId.set(c.id, latest.id);
      }
    }
    summary.deduped = rows.length - keptRows.length;

    // Insert oldest-first so a RENEWED row's parent already has a new id.
    keptRows.sort((a, b) => ts(a.created_at) - ts(b.created_at) || a.id - b.id);

    const studentCache = new Map<
      number,
      { id: number; uid: string; previousUid: string | null } | null
    >();
    const getStudent = async (legacyStudentId: number) => {
      if (studentCache.has(legacyStudentId))
        return studentCache.get(legacyStudentId)!;
      const [s] = await db
        .select({
          id: studentModel.id,
          uid: studentModel.uid,
          previousUid: studentModel.previousUid,
        })
        .from(studentModel)
        .where(eq(studentModel.legacyStudentId, legacyStudentId));
      const v = s ?? null;
      studentCache.set(legacyStudentId, v);
      return v;
    };

    // Store ONLY the cropped student photo per uid (crop=true). The card itself
    // is re-generated from the active template + this photo on display, so there
    // is no need to store the composed card. The photo goes in BOTH photoImageKey
    // (used by the issue page to re-compose) and frontImageKey.
    const uidImageKey = new Map<string, string | null>();
    const ensureImage = async (
      uid: string,
      previousUid?: string | null,
    ): Promise<string | null> => {
      if (uidImageKey.has(uid)) return uidImageKey.get(uid)!;
      const key = `idcard/legacy/${uid}.png`;
      let result: string | null = null;
      try {
        if (await fileExistsInS3(key)) {
          summary.imageSkipped++;
          result = key;
        } else {
          // The old image service is keyed by the code the student had in the
          // legacy system. After a shift change the new uid differs, so the
          // photo may only exist under the previous uid — try both (current
          // first). We always store it under the current uid.
          const candidates = [
            ...new Set(
              [uid, previousUid].filter((u): u is string => !!u && u !== ""),
            ),
          ];
          for (const sourceUid of candidates) {
            const res = await fetch(
              `${IMAGE_BASE_URL}?crop=true&uid=${encodeURIComponent(sourceUid)}`,
            );
            if (!res.ok) continue;
            const buf = Buffer.from(await res.arrayBuffer());
            if (!buf.length) continue;
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
            result = key;
            break;
          }
        }
      } catch {
        // leave null
      }
      uidImageKey.set(uid, result);
      return result;
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

        const imageKey = await ensureImage(student.uid, student.previousUid);

        const [inserted] = await db
          .insert(idCardIssueModel)
          .values({
            legacyIssueId: r.id,
            studentId: student.id,
            issueStatus: r.issue_status,
            renewedFromIssueId: renewedFromNew ?? null,
            issueDate: new Date(r.created_at),
            validTill: toDateOnly(r.expiry_date),
            frontImageKey: imageKey ?? undefined,
            photoImageKey: imageKey ?? undefined,
            nameSnapshot: r.name ?? undefined,
            courseSnapshot: r.course_name ?? undefined,
            bloodGroupSnapshot: r.blood_group_name ?? undefined,
            mobileSnapshot: r.phone_mobile_no ?? undefined,
            sportsQuotaSnapshot: r.sports_quota ?? undefined,
            uidSnapshot: student.uid,
            remarks: r.remarks ?? undefined,
            // Preserve the original old-DB timestamps instead of the sync time.
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at ?? r.created_at),
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
  } finally {
    syncRunning = false;
  }
}
