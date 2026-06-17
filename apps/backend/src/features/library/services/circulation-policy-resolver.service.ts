import { db } from "@/db/index.js";
import { and, eq, isNull, or } from "drizzle-orm";
import { circulationPolicyModel } from "@repo/db/schemas/models/library/circulation-policy.model.js";
import { patronCategoryModel } from "@repo/db/schemas/models/library/patron-category.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";

export type EffectivePolicy = {
  loanDays: number;
  finePerDay: number;
  renewalLimit: number;
  graceDays: number;
  policyId: number | null;
};

const DEFAULTS: EffectivePolicy = {
  loanDays: 7,
  finePerDay: 1,
  renewalLimit: 1,
  graceDays: 0,
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
  const mappedName = NAME_BY_USER_TYPE[u.type] ?? u.type;
  const [pc] = await db
    .select({ id: patronCategoryModel.id })
    .from(patronCategoryModel)
    .where(eq(patronCategoryModel.name, mappedName))
    .limit(1);
  return pc?.id ?? null;
}

export async function resolveItemCategoryIdForCopy(
  copyDetailsId: number,
): Promise<number | null> {
  const [c] = await db
    .select({ id: copyDetailsModel.itemCategoryId })
    .from(copyDetailsModel)
    .where(eq(copyDetailsModel.id, copyDetailsId))
    .limit(1);
  return c?.id ?? null;
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
