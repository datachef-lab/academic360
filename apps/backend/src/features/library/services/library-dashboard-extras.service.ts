import { db } from "@/db/index.js";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { branchModel } from "@repo/db/schemas/models/library/branch.model.js";
import { libraryZoneModel } from "@repo/db/schemas/models/library/library-zone.model.js";
import { patronCategoryModel } from "@repo/db/schemas/models/library/patron-category.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { circulationPolicyModel } from "@repo/db/schemas/models/library/circulation-policy.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { libraryEntryExitModel } from "@repo/db/schemas/models/library/library-entry-exit.model.js";

/**
 * Rows for the "Patrons" tab. Every returned patron either has active loans
 * or an outstanding fine (or both) — a full user directory would drown the
 * dashboard; this is the operational set only.
 *
 * `activeIssues` counts un-returned circulation rows. `overdue` is the subset
 * of those past their return timestamp. `outstandingFine` is
 * `SUM(fineAmount − fineWaiver) WHERE paymentId IS NULL`, which is what the
 * fines panel already uses; we surface it per patron here.
 */
export async function listActivePatrons(limit = 100): Promise<
  Array<{
    userId: number;
    userName: string | null;
    userType: string;
    activeIssues: number;
    overdue: number;
    outstandingFine: number;
  }>
> {
  const rows = await db
    .select({
      userId: userModel.id,
      userName: userModel.name,
      userType: sql<string>`${userModel.type}::text`,
      activeIssues: sql<number>`SUM(CASE WHEN ${bookCirculationModel.isReturned} = false THEN 1 ELSE 0 END)::int`,
      overdue: sql<number>`SUM(CASE WHEN ${bookCirculationModel.isReturned} = false AND ${bookCirculationModel.returnTimestamp} < NOW() THEN 1 ELSE 0 END)::int`,
      outstandingFine: sql<number>`COALESCE(SUM(CASE WHEN ${bookCirculationModel.paymentId} IS NULL THEN ${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver} ELSE 0 END), 0)`,
    })
    .from(bookCirculationModel)
    .innerJoin(userModel, eq(userModel.id, bookCirculationModel.userId))
    .groupBy(userModel.id, userModel.name, userModel.type)
    .having(
      sql`SUM(CASE WHEN ${bookCirculationModel.isReturned} = false THEN 1 ELSE 0 END) > 0
       OR SUM(CASE WHEN ${bookCirculationModel.paymentId} IS NULL THEN ${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver} ELSE 0 END) > 0`,
    )
    .orderBy(
      desc(
        sql`SUM(CASE WHEN ${bookCirculationModel.isReturned} = false AND ${bookCirculationModel.returnTimestamp} < NOW() THEN 1 ELSE 0 END)`,
      ),
      desc(
        sql`SUM(CASE WHEN ${bookCirculationModel.isReturned} = false THEN 1 ELSE 0 END)`,
      ),
    )
    .limit(limit);
  return rows.map((r) => ({
    ...r,
    activeIssues: Number(r.activeIssues ?? 0),
    overdue: Number(r.overdue ?? 0),
    outstandingFine: Number(r.outstandingFine ?? 0),
  }));
}

/**
 * Rows for the "Items" tab. One row per item category (seeded), plus the
 * derived counts — books tagged with the category, copies of those books, and
 * how many of those copies are currently issued.
 *
 * Books do NOT carry an item-category FK today. `bookModel.libraryDocumentTypeId`
 * points at legacy `document_types` from the IRP loader, not the seeded
 * `library_item_categories`. Rather than fake a join, this returns the
 * category rows with a total-books/copies snapshot; the per-category breakdown
 * will come when a book → item_category FK is added. Called out in the UI.
 */
export async function listItemCategories(): Promise<
  Array<{
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    isActive: boolean;
  }>
> {
  return db
    .select({
      id: itemCategoryModel.id,
      name: itemCategoryModel.name,
      code: itemCategoryModel.code,
      description: itemCategoryModel.description,
      isActive: itemCategoryModel.isActive,
    })
    .from(itemCategoryModel)
    .orderBy(itemCategoryModel.name);
}

/**
 * Rows for the "Branches & Zones" tab. Branches with their zone list and
 * live-in-library counts, so the operator sees where copies live and who is
 * currently inside per branch.
 */
export async function listBranchesWithZones(): Promise<
  Array<{
    branchId: number;
    branchName: string;
    branchCode: string | null;
    isActive: boolean;
    copies: number;
    currentlyInside: number;
    zones: Array<{ id: number; name: string; capacity: number | null }>;
  }>
> {
  const branches = await db
    .select({
      id: branchModel.id,
      name: branchModel.name,
      code: branchModel.code,
      isActive: branchModel.isActive,
    })
    .from(branchModel)
    .orderBy(branchModel.name);

  if (branches.length === 0) return [];

  const [copyCounts, inside, zones] = await Promise.all([
    db
      .select({
        branchId: copyDetailsModel.branchId,
        n: count(copyDetailsModel.id),
      })
      .from(copyDetailsModel)
      .groupBy(copyDetailsModel.branchId),
    db
      .select({
        branchId: libraryEntryExitModel.branchId,
        n: count(libraryEntryExitModel.id),
      })
      .from(libraryEntryExitModel)
      .where(eq(libraryEntryExitModel.currentStatus, "CHECKED_IN"))
      .groupBy(libraryEntryExitModel.branchId),
    db
      .select({
        id: libraryZoneModel.id,
        name: libraryZoneModel.name,
        capacity: libraryZoneModel.capacity,
        branchId: libraryZoneModel.branchId,
      })
      .from(libraryZoneModel)
      .orderBy(libraryZoneModel.name),
  ]);

  const cById = new Map(copyCounts.map((c) => [c.branchId, Number(c.n)]));
  const iById = new Map(inside.map((c) => [c.branchId, Number(c.n)]));

  return branches.map((b) => ({
    branchId: b.id,
    branchName: b.name,
    branchCode: b.code,
    isActive: b.isActive,
    copies: cById.get(b.id) ?? 0,
    currentlyInside: iById.get(b.id) ?? 0,
    zones: zones
      .filter((z) => z.branchId === b.id)
      .map((z) => ({ id: z.id, name: z.name, capacity: z.capacity })),
  }));
}

/**
 * Rows for the "Policies" tab. Flat matrix of every circulation-policy row
 * with its patron and item category names resolved — the seed matrix rendered
 * back at the operator.
 */
export async function listCirculationPolicies(): Promise<
  Array<{
    id: number;
    patronCategory: string;
    itemCategory: string;
    loanDays: number;
    graceDays: number;
    finePerDay: number;
    renewalLimit: number;
    maxCopiesAtOnce: number;
    isActive: boolean;
  }>
> {
  const rows = await db
    .select({
      id: circulationPolicyModel.id,
      patronCategory: patronCategoryModel.name,
      itemCategory: itemCategoryModel.name,
      loanDays: circulationPolicyModel.loanDays,
      graceDays: circulationPolicyModel.graceDays,
      finePerDay: circulationPolicyModel.finePerDay,
      renewalLimit: circulationPolicyModel.renewalLimit,
      maxCopiesAtOnce: circulationPolicyModel.maxCopiesAtOnce,
      isActive: circulationPolicyModel.isActive,
    })
    .from(circulationPolicyModel)
    .innerJoin(
      patronCategoryModel,
      eq(patronCategoryModel.id, circulationPolicyModel.patronCategoryId),
    )
    .innerJoin(
      itemCategoryModel,
      eq(itemCategoryModel.id, circulationPolicyModel.itemCategoryId),
    )
    .orderBy(patronCategoryModel.name, itemCategoryModel.name);
  return rows.map((r) => ({
    ...r,
    finePerDay: Number(r.finePerDay),
  }));
}
