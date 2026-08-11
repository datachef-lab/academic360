import { db, pool } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import { sql } from "drizzle-orm";

const log = createLogger("board-subject-dedupe");

/**
 * Advisory lock for this heal specifically.
 *
 * Production runs several EC2 instances and every one runs boot migrations on
 * startup. This heal takes its OWN lock rather than relying on a runner-level
 * one, so it stays correct no matter which branch it lands on or what order the
 * migration list is in. Arbitrary but fixed; do not reuse.
 */
const BOARD_SUBJECT_DEDUPE_LOCK_KEY = 918360002;

const UNIQUE_CONSTRAINT =
  "board_subjects_board_id_fk_board_subject_name_id_fk_unique";

/**
 * Collapse duplicate `board_subjects` rows and make the duplication impossible.
 *
 * Why this exists: (board, subject) is the natural key but nothing enforced it,
 * and the per-student legacy importer inserted a fresh all-zero row whenever the
 * legacy mapping lookup fell through — 14,307 rows for 661 real pairs, one key
 * with 509 copies.
 *
 * Safe to run on every boot, forever:
 *
 * - **It never removes a fix.** It only ever collapses rows that share a
 *   (board, subject) pair, and it keeps the most informative one — real marks
 *   beat all-zero placeholders, a real passing mark beats 0. An admin who later
 *   corrects a row's marks is choosing the survivor, not losing it. Rows that
 *   are already unique are never touched.
 * - **It is a no-op once healed.** The unique constraint it installs makes
 *   duplicates impossible, so the very first check short-circuits on every
 *   subsequent boot.
 * - **It cannot misfile a student.** The remap joins through the pair itself, so
 *   a child row can only be repointed to a survivor of its own (board, subject).
 *   The transaction verifies that and aborts rather than commit a mismatch.
 *
 * Normally the migration (`0175`) has already done this; this is the self-heal
 * for a database where migrations were skipped or ran out of order.
 */
export async function runBoardSubjectDedupe(): Promise<
  Record<string, unknown>
> {
  const lockClient = await pool.connect();
  let holdsLock = false;

  try {
    const lockRes = await lockClient.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [BOARD_SUBJECT_DEDUPE_LOCK_KEY],
    );
    holdsLock = lockRes.rows[0]?.locked === true;
    if (!holdsLock) {
      return { skipped: true, reason: "another instance holds the lock" };
    }

    // Cheapest possible check first: once the constraint exists, duplicates
    // cannot exist either, so there is nothing to do.
    const [{ present }] = (
      await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = ${UNIQUE_CONSTRAINT}
        ) AS present`)
    ).rows as unknown as { present: boolean }[];

    if (present) return { alreadyHealed: true };

    const result = await db.transaction(async (tx) => {
      const before = (
        await tx.execute(sql`SELECT count(*)::int AS n FROM board_subjects`)
      ).rows[0] as unknown as { n: number };

      // Snapshot what every student row RESOLVES TO, so the change can be proven
      // rather than assumed.
      await tx.execute(sql`
        CREATE TEMP TABLE _sig_before ON COMMIT DROP AS
        SELECT sas.id AS sas_id, bs.board_id_fk AS b, bs.board_subject_name_id_fk AS s
        FROM student_academic_subjects sas
        JOIN board_subjects bs ON bs.id = sas.board_subject_id_fk`);

      await tx.execute(sql`
        CREATE TEMP TABLE _keep ON COMMIT DROP AS
        SELECT DISTINCT ON (board_id_fk, board_subject_name_id_fk)
               id AS survivor_id, board_id_fk AS b, board_subject_name_id_fk AS s
        FROM board_subjects
        ORDER BY board_id_fk, board_subject_name_id_fk,
          (CASE WHEN COALESCE(full_marks_theory,0)=0 AND COALESCE(passing_marks_theory,0)=0
                     AND COALESCE(full_marks_practical,0)=0 AND COALESCE(passing_marks_practical,0)=0
                THEN 1 ELSE 0 END) ASC,
          COALESCE(passing_marks_theory,0) DESC,
          COALESCE(full_marks_theory,0) DESC,
          (CASE WHEN legacy_board_subject_mapping_sub_id IS NOT NULL THEN 0 ELSE 1 END) ASC,
          id ASC`);

      await tx.execute(sql`
        UPDATE student_academic_subjects sas
        SET board_subject_id_fk = k.survivor_id
        FROM board_subjects bs
        JOIN _keep k ON k.b = bs.board_id_fk AND k.s = bs.board_subject_name_id_fk
        WHERE bs.id = sas.board_subject_id_fk AND sas.board_subject_id_fk <> k.survivor_id`);

      await tx.execute(sql`
        UPDATE board_subject_univ_subject_mappings m
        SET board_subject_id_fk = k.survivor_id
        FROM board_subjects bs
        JOIN _keep k ON k.b = bs.board_id_fk AND k.s = bs.board_subject_name_id_fk
        WHERE bs.id = m.board_subject_id_fk AND m.board_subject_id_fk <> k.survivor_id`);

      await tx.execute(
        sql`DELETE FROM board_subjects WHERE id NOT IN (SELECT survivor_id FROM _keep)`,
      );

      // Prove no student moved; abort the whole heal if any did.
      const [{ changed, lost }] = (
        await tx.execute(sql`
          SELECT
            (SELECT count(*) FROM _sig_before a
               JOIN (SELECT sas.id AS sas_id, bs.board_id_fk AS b, bs.board_subject_name_id_fk AS s
                     FROM student_academic_subjects sas
                     JOIN board_subjects bs ON bs.id = sas.board_subject_id_fk) z
                 ON z.sas_id = a.sas_id
              WHERE a.b IS DISTINCT FROM z.b OR a.s IS DISTINCT FROM z.s)::int AS changed,
            (SELECT count(*) FROM _sig_before a
              WHERE NOT EXISTS (SELECT 1 FROM student_academic_subjects sas WHERE sas.id = a.sas_id))::int AS lost`)
      ).rows as unknown as { changed: number; lost: number }[];

      if (changed !== 0 || lost !== 0) {
        throw new Error(
          `board-subject dedupe aborted: ${changed} student rows changed pair, ${lost} lost`,
        );
      }

      await tx.execute(sql`
        ALTER TABLE board_subjects
        ADD CONSTRAINT ${sql.raw(UNIQUE_CONSTRAINT)}
        UNIQUE (board_id_fk, board_subject_name_id_fk)`);

      const after = (
        await tx.execute(sql`SELECT count(*)::int AS n FROM board_subjects`)
      ).rows[0] as unknown as { n: number };

      return { before: before.n, after: after.n, removed: before.n - after.n };
    });

    log.info(
      `deduped board_subjects ${result.before} -> ${result.after} and installed the unique constraint`,
    );
    return result;
  } finally {
    if (holdsLock) {
      await lockClient
        .query("SELECT pg_advisory_unlock($1)", [BOARD_SUBJECT_DEDUPE_LOCK_KEY])
        .catch(() => undefined);
    }
    lockClient.release();
  }
}
