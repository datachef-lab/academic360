import { db } from "@/db/index.js";
import { promotionModel } from "@repo/db/schemas/models/batches";
import { sessionModel } from "@repo/db/schemas/models/academics";
import { and, eq, sql } from "drizzle-orm";

/**
 * Resolve which promotion a dated event belongs to.
 *
 * Documents are recorded against a promotion, but several source tables (ID card
 * issues in particular) carry only a student and a date. Matching that date to a
 * promotion needs one wrinkle: **the event usually predates the promotion**.
 * Cards are printed shortly before the session opens, so on live data 82% of
 * id_card_issues rows are dated 0-60 days BEFORE their promotion's `start_date`.
 * A plain `start_date <= asOf` window matched only 1,261 of 6,949 rows; with the
 * grace below, 6,936 match exactly one promotion and the tiebreak settles the
 * remaining 13.
 *
 * The same 60-day grace is used (and documented) by the realtime tracker when it
 * attributes a legacy card to an academic year — see
 * `realtime-tracker.service.ts` `buildIdCardIssuedExistsSql()`.
 */

/** Shared with career-progression: deprecated promotions never resolve. */
const NON_DEPRECATED_PROMOTION_SQL = sql`COALESCE(${promotionModel.isDeprecated}, false) = false`;

export const DEFAULT_PROMOTION_GRACE_DAYS = 60;

export type ResolvedPromotion = {
  promotionId: number;
  /** How it was found — useful when logging a backfill. */
  matchedBy: "window" | "fallback";
};

/**
 * The promotion a student was in on `asOfDate`.
 *
 * A student holds one promotion per SEMESTER, so a session yields two candidates;
 * `class_id ASC` picks the odd/first semester, which is when a card for that year
 * is issued.
 *
 * Returns `null` only if the student has no promotions at all. (On live data every
 * one of the 6,949 id_card_issues rows has at least one.)
 */
export async function resolvePromotionForDate(
  studentId: number,
  asOfDate: Date,
  opts: { graceDays?: number } = {},
): Promise<ResolvedPromotion | null> {
  const graceDays = opts.graceDays ?? DEFAULT_PROMOTION_GRACE_DAYS;
  const asOf = sql`${asOfDate.toISOString()}::timestamptz`;
  const grace = sql.raw(
    `interval '${Math.max(0, Math.trunc(graceDays))} days'`,
  );

  const [windowed] = await db
    .select({ id: promotionModel.id })
    .from(promotionModel)
    .where(
      and(
        eq(promotionModel.studentId, studentId),
        NON_DEPRECATED_PROMOTION_SQL,
        sql`(${promotionModel.startDate} IS NULL OR ${asOf} >= ${promotionModel.startDate} - ${grace})`,
        sql`(${promotionModel.endDate} IS NULL OR ${asOf} <= ${promotionModel.endDate} + interval '1 day')`,
      ),
    )
    // Most recent session first, then the odd semester within it.
    .orderBy(
      sql`${promotionModel.startDate} DESC NULLS LAST`,
      sql`${promotionModel.classId} ASC`,
      sql`${promotionModel.id} ASC`,
    )
    .limit(1);

  if (windowed) return { promotionId: windowed.id, matchedBy: "window" };

  // No window matched — e.g. a card reissued in July for a student not yet
  // promoted into the new session. Fall back to their latest promotion.
  const [latest] = await db
    .select({ id: promotionModel.id })
    .from(promotionModel)
    .where(
      and(
        eq(promotionModel.studentId, studentId),
        NON_DEPRECATED_PROMOTION_SQL,
      ),
    )
    .orderBy(
      sql`${promotionModel.startDate} DESC NULLS LAST`,
      sql`${promotionModel.id} DESC`,
    )
    .limit(1);

  return latest ? { promotionId: latest.id, matchedBy: "fallback" } : null;
}

/**
 * The promotion a student held in a given academic year.
 *
 * Preferred over {@link resolvePromotionForDate} whenever the source row carries
 * an explicit academic year — CU registration correction requests do, which is
 * why every one of their 15,295 uploads resolves without needing the date grace.
 *
 * A student holds one promotion per SEMESTER, so a year yields two candidates;
 * `class_id ASC` picks the odd/first semester, matching the ID card rule.
 */
export async function resolvePromotionForAcademicYear(
  studentId: number,
  academicYearId: number,
): Promise<ResolvedPromotion | null> {
  const [row] = await db
    .select({ id: promotionModel.id })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .where(
      and(
        eq(promotionModel.studentId, studentId),
        eq(sessionModel.academicYearId, academicYearId),
        NON_DEPRECATED_PROMOTION_SQL,
      ),
    )
    .orderBy(sql`${promotionModel.classId} ASC`, sql`${promotionModel.id} ASC`)
    .limit(1);

  return row ? { promotionId: row.id, matchedBy: "window" } : null;
}
