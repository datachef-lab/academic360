import { db } from "@/db/index.js";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { circulationPolicyModel } from "@repo/db/schemas/models/library/circulation-policy.model.js";
import { patronCategoryModel } from "@repo/db/schemas/models/library/patron-category.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model.js";

export type EffectivePolicy = {
  loanDays: number;
  finePerDay: number;
  renewalLimit: number;
  graceDays: number;
  maxCopiesAtOnce: number;
  skipHolidaysInFine: boolean;
  policyId: number | null;
};

const DEFAULTS: EffectivePolicy = {
  loanDays: 7,
  finePerDay: 1,
  renewalLimit: 1,
  graceDays: 0,
  maxCopiesAtOnce: 3,
  skipHolidaysInFine: true,
  policyId: null,
};

const NAME_BY_USER_TYPE: Record<string, string> = {
  STUDENT: "STUDENT",
  FACULTY: "FACULTY",
  STAFF: "STAFF",
  ADMIN: "STAFF",
  PARENTS: "STUDENT",
};

export async function resolvePatronCategoryIdForUser(
  userId: number,
): Promise<number | null> {
  const [u] = await db
    .select({ type: userModel.type })
    .from(userModel)
    .where(eq(userModel.id, userId))
    .limit(1);
  if (!u?.type) return null;
  const mapped = NAME_BY_USER_TYPE[u.type] ?? u.type;
  // Seeded categories carry the canonical uppercase `code` (STUDENT/FACULTY/
  // STAFF/GUEST); the case-insensitive name match only covers hand-created
  // categories that never got a code.
  const [pc] = await db
    .select({ id: patronCategoryModel.id })
    .from(patronCategoryModel)
    .where(
      or(
        eq(patronCategoryModel.code, mapped),
        ilike(patronCategoryModel.name, mapped),
      ),
    )
    .orderBy(
      sql`CASE WHEN ${patronCategoryModel.code} = ${mapped} THEN 0 ELSE 1 END`,
    )
    .limit(1);
  return pc?.id ?? null;
}

// Item category lives on the title (books.item_category_id_fk); the copy-level
// column is a per-copy override for the rare titles that mix categories.
export async function resolveItemCategoryIdForCopy(
  copyDetailsId: number,
): Promise<number | null> {
  const [c] = await db
    .select({
      copyItemCategoryId: copyDetailsModel.itemCategoryId,
      bookItemCategoryId: bookModel.itemCategoryId,
    })
    .from(copyDetailsModel)
    .leftJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
    .where(eq(copyDetailsModel.id, copyDetailsId))
    .limit(1);
  return c?.copyItemCategoryId ?? c?.bookItemCategoryId ?? null;
}

export async function resolveEffectivePolicy(args: {
  patronCategoryId?: number | null;
  itemCategoryId?: number | null;
}): Promise<EffectivePolicy> {
  const { patronCategoryId, itemCategoryId } = args;
  if (!patronCategoryId && !itemCategoryId) return DEFAULTS;

  // Strict match first; then partial-match fallbacks
  const candidates = await db
    .select()
    .from(circulationPolicyModel)
    .where(
      or(
        and(
          patronCategoryId
            ? eq(circulationPolicyModel.patronCategoryId, patronCategoryId)
            : isNull(circulationPolicyModel.patronCategoryId),
          itemCategoryId
            ? eq(circulationPolicyModel.itemCategoryId, itemCategoryId)
            : isNull(circulationPolicyModel.itemCategoryId),
        ),
        patronCategoryId
          ? eq(circulationPolicyModel.patronCategoryId, patronCategoryId)
          : isNull(circulationPolicyModel.patronCategoryId),
        itemCategoryId
          ? eq(circulationPolicyModel.itemCategoryId, itemCategoryId)
          : isNull(circulationPolicyModel.itemCategoryId),
      ),
    );

  if (!candidates.length) return DEFAULTS;

  const best =
    candidates.find(
      (c) =>
        c.patronCategoryId === patronCategoryId &&
        c.itemCategoryId === itemCategoryId,
    ) ??
    candidates.find((c) => c.patronCategoryId === patronCategoryId) ??
    candidates.find((c) => c.itemCategoryId === itemCategoryId) ??
    candidates[0];

  return {
    loanDays: best.loanDays ?? DEFAULTS.loanDays,
    finePerDay: Number(best.finePerDay ?? DEFAULTS.finePerDay),
    renewalLimit: best.renewalLimit ?? DEFAULTS.renewalLimit,
    graceDays: best.graceDays ?? DEFAULTS.graceDays,
    maxCopiesAtOnce: best.maxCopiesAtOnce ?? DEFAULTS.maxCopiesAtOnce,
    skipHolidaysInFine: best.skipHolidaysInFine ?? DEFAULTS.skipHolidaysInFine,
    policyId: best.id,
  };
}

export async function resolvePolicyForCirculation(
  userId: number,
  copyDetailsId: number,
): Promise<EffectivePolicy> {
  const [patronCategoryId, itemCategoryId] = await Promise.all([
    resolvePatronCategoryIdForUser(userId),
    resolveItemCategoryIdForCopy(copyDetailsId),
  ]);
  return resolveEffectivePolicy({ patronCategoryId, itemCategoryId });
}

/**
 * Resolves the current class of a user (when the user is a student). Used by the
 * fine calculator so class-specific holidays (class_holiday rows) are excluded
 * from billable days. Returns null for non-students or when no promotion exists.
 */
export async function resolveCurrentClassIdForUser(
  userId: number,
): Promise<number | null> {
  const [student] = await db
    .select({ id: studentModel.id })
    .from(studentModel)
    .where(eq(studentModel.userId, userId))
    .limit(1);
  if (!student) return null;
  const [promo] = await db
    .select({ classId: promotionModel.classId })
    .from(promotionModel)
    .where(eq(promotionModel.studentId, student.id))
    .orderBy(desc(promotionModel.id))
    .limit(1);
  return promo?.classId ?? null;
}
