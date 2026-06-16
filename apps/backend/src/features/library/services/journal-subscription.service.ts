import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, gte, lte, SQL } from "drizzle-orm";
import { journalSubscriptionModel } from "@repo/db/schemas/models/library/journal-subscription.model.js";
import { journalIssueModel } from "@repo/db/schemas/models/library/journal-issue.model.js";
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";
import { vendorModel } from "@repo/db/schemas/models/library/vendor.model.js";

export type SubscriptionListFilters = {
  page: number;
  limit: number;
  journalId?: number;
  vendorId?: number;
  isActive?: boolean;
};

export type SubscriptionRow = {
  id: number;
  journalId: number;
  journalTitle: string;
  vendorId: number | null;
  vendorName: string | null;
  startDate: string;
  endDate: string;
  frequency: string | null;
  costPerYear: number;
  isActive: boolean;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SubscriptionUpsertInput = {
  journalId: number;
  vendorId?: number | null;
  startDate: string;
  endDate: string;
  frequency?: string | null;
  costPerYear: number;
  isActive?: boolean;
  remarks?: string | null;
};

const COLS = {
  id: journalSubscriptionModel.id,
  journalId: journalSubscriptionModel.journalId,
  journalTitle: journalModel.title,
  vendorId: journalSubscriptionModel.vendorId,
  vendorName: vendorModel.name,
  startDate: journalSubscriptionModel.startDate,
  endDate: journalSubscriptionModel.endDate,
  frequency: journalSubscriptionModel.frequency,
  costPerYear: journalSubscriptionModel.costPerYear,
  isActive: journalSubscriptionModel.isActive,
  remarks: journalSubscriptionModel.remarks,
  createdAt: journalSubscriptionModel.createdAt,
  updatedAt: journalSubscriptionModel.updatedAt,
};

const buildWhere = (
  f: Omit<SubscriptionListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (f.journalId != null)
    parts.push(eq(journalSubscriptionModel.journalId, f.journalId));
  if (f.vendorId != null)
    parts.push(eq(journalSubscriptionModel.vendorId, f.vendorId));
  if (f.isActive != null)
    parts.push(eq(journalSubscriptionModel.isActive, f.isActive));
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findSubscriptionsPaginated(
  filters: SubscriptionListFilters,
) {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildWhere(rest);
  const [{ total }] = await db
    .select({ total: count() })
    .from(journalSubscriptionModel)
    .where(whereClause);
  const rows = await db
    .select(COLS)
    .from(journalSubscriptionModel)
    .innerJoin(
      journalModel,
      eq(journalModel.id, journalSubscriptionModel.journalId),
    )
    .leftJoin(
      vendorModel,
      eq(vendorModel.id, journalSubscriptionModel.vendorId),
    )
    .where(whereClause)
    .orderBy(desc(journalSubscriptionModel.id))
    .limit(limit)
    .offset(offset);
  return { rows, total, page, limit };
}

export async function getSubscriptionById(id: number) {
  const [row] = await db
    .select(COLS)
    .from(journalSubscriptionModel)
    .innerJoin(
      journalModel,
      eq(journalModel.id, journalSubscriptionModel.journalId),
    )
    .leftJoin(
      vendorModel,
      eq(vendorModel.id, journalSubscriptionModel.vendorId),
    )
    .where(eq(journalSubscriptionModel.id, id))
    .limit(1);
  return row ?? null;
}

const validate = (i: SubscriptionUpsertInput) => {
  if (!i.journalId) throw new ApiError(400, "journalId is required.");
  if (!i.startDate || !i.endDate)
    throw new ApiError(400, "startDate and endDate are required.");
  if (new Date(i.startDate) > new Date(i.endDate))
    throw new ApiError(400, "startDate must be on or before endDate.");
  if (i.costPerYear < 0)
    throw new ApiError(400, "costPerYear must be non-negative.");
};

export async function createSubscription(input: SubscriptionUpsertInput) {
  validate(input);
  const [inserted] = await db
    .insert(journalSubscriptionModel)
    .values({
      journalId: input.journalId,
      vendorId: input.vendorId ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      frequency: input.frequency?.trim() || null,
      costPerYear: input.costPerYear,
      isActive: input.isActive ?? true,
      remarks: input.remarks?.trim() || null,
    })
    .returning({ id: journalSubscriptionModel.id });
  return inserted.id;
}

export async function updateSubscription(
  id: number,
  input: SubscriptionUpsertInput,
) {
  validate(input);
  await db
    .update(journalSubscriptionModel)
    .set({
      journalId: input.journalId,
      vendorId: input.vendorId ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      frequency: input.frequency?.trim() || null,
      costPerYear: input.costPerYear,
      isActive: input.isActive ?? true,
      remarks: input.remarks?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(journalSubscriptionModel.id, id));
}

export async function deleteSubscription(id: number) {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(journalIssueModel)
    .where(eq(journalIssueModel.subscriptionId, id));
  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `Cannot delete: ${linkedCount} issue(s) link to this subscription.`,
    );
  }
  await db
    .delete(journalSubscriptionModel)
    .where(eq(journalSubscriptionModel.id, id));
}

export async function listIssuesBySubscription(subscriptionId: number) {
  return db
    .select({
      id: journalIssueModel.id,
      subscriptionId: journalIssueModel.subscriptionId,
      issueNumber: journalIssueModel.issueNumber,
      expectedDate: journalIssueModel.expectedDate,
      receivedDate: journalIssueModel.receivedDate,
      condition: journalIssueModel.condition,
      remarks: journalIssueModel.remarks,
    })
    .from(journalIssueModel)
    .where(eq(journalIssueModel.subscriptionId, subscriptionId))
    .orderBy(journalIssueModel.expectedDate);
}

export async function createIssue(input: {
  subscriptionId: number;
  issueNumber: string;
  expectedDate: string;
  receivedDate?: string | null;
  condition?: string | null;
  remarks?: string | null;
}) {
  if (!input.subscriptionId)
    throw new ApiError(400, "subscriptionId is required.");
  if (!input.issueNumber?.trim())
    throw new ApiError(400, "issueNumber is required.");
  if (!input.expectedDate) throw new ApiError(400, "expectedDate is required.");
  const [inserted] = await db
    .insert(journalIssueModel)
    .values({
      subscriptionId: input.subscriptionId,
      issueNumber: input.issueNumber.trim(),
      expectedDate: input.expectedDate,
      receivedDate: input.receivedDate || null,
      condition: input.condition?.trim() || null,
      remarks: input.remarks?.trim() || null,
    })
    .returning({ id: journalIssueModel.id });
  return inserted.id;
}

export async function updateIssue(
  id: number,
  input: Partial<{
    issueNumber: string;
    expectedDate: string;
    receivedDate: string | null;
    condition: string | null;
    remarks: string | null;
  }>,
) {
  await db
    .update(journalIssueModel)
    .set({
      ...(input.issueNumber !== undefined
        ? { issueNumber: input.issueNumber.trim() }
        : {}),
      ...(input.expectedDate !== undefined
        ? { expectedDate: input.expectedDate }
        : {}),
      ...(input.receivedDate !== undefined
        ? { receivedDate: input.receivedDate || null }
        : {}),
      ...(input.condition !== undefined
        ? { condition: input.condition?.trim() || null }
        : {}),
      ...(input.remarks !== undefined
        ? { remarks: input.remarks?.trim() || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(journalIssueModel.id, id));
}

export async function deleteIssue(id: number) {
  await db.delete(journalIssueModel).where(eq(journalIssueModel.id, id));
}

export async function findMissingIssues(
  asOf: Date = new Date(),
): Promise<
  Array<{
    id: number;
    subscriptionId: number;
    issueNumber: string;
    expectedDate: string;
  }>
> {
  return db
    .select({
      id: journalIssueModel.id,
      subscriptionId: journalIssueModel.subscriptionId,
      issueNumber: journalIssueModel.issueNumber,
      expectedDate: journalIssueModel.expectedDate,
    })
    .from(journalIssueModel)
    .where(
      and(
        lte(journalIssueModel.expectedDate, asOf.toISOString().slice(0, 10)),
        // receivedDate IS NULL
      ),
    );
}
