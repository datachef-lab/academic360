// Aggregate read-only queries powering the console's Documents Dashboard.
// Every query here is additive (SELECT only) — no domain mutation lives in
// this file. Kept as three focused functions (summary / handovers /
// fee-clearance) mirroring the dashboard's three data-heavy tabs, so each
// can be cached/paginated independently later without touching the others.
//
// Built entirely on the Drizzle query builder (eq/and/or/count/exists, …) —
// no raw `sql` template queries. Anything Postgres would normally do with
// date arithmetic, GROUP BY … date_trunc, array_agg or FILTER is instead
// computed in JS after a plain SELECT, which keeps every query a
// first-class Drizzle builder call.

import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/index.js";
import {
  documentBatchReceiptModel,
  documentBatchReceiptModeModel,
  documentBatchReceiptProgramCourseModel,
  documentLedgerModel,
  documentTypeModel,
} from "@repo/db/schemas/models/documents";
import { promotionModel } from "@repo/db/schemas/models/batches";
import { classModel, sessionModel } from "@repo/db/schemas/models/academics";
import { studentModel, userModel } from "@repo/db/schemas/models/user";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import { examFormFillupModel } from "@repo/db/schemas/models/exams";
import { feeStudentMappingModel } from "@repo/db/schemas/models/fees";

const providerUserModel = alias(userModel, "provider_user");

const DAY_MS = 24 * 60 * 60 * 1000;
const num = (v: unknown): number => Number(v ?? 0);
/** UTC calendar-day key. Internally consistent (used for both bucket keys
 *  and row timestamps below) even though it may not match the server's
 *  local calendar date — good enough for a day-by-day activity chart. */
const dayKey = (d: Date): string => d.toISOString().slice(0, 10);

type LedgerStatus =
  | "UPLOADED"
  | "PENDING"
  | "ON_HOLD"
  | "COLLECTED"
  | "WAIVED"
  | "EXPECTED"
  | "NO_CHANGE";

/* ------------------------------------------------------------------------- */
/*                                  Summary                                  */
/* ------------------------------------------------------------------------- */

export type DashboardSummary = {
  totals: {
    totalLedgerRows: number;
    collectedToday: number;
    collected7d: number;
    uploaded7d: number;
    onHold: number;
    pendingTotal: number;
    pendingBatchCount: number;
    /** Sum of (eligible - materialised) across batches currently drifted. */
    topUpBacklogRows: number;
    topUpBacklogBatches: number;
  };
  statusCounts: { status: LedgerStatus; count: number }[];
  dailyActivity: { date: string; collected: number; uploaded: number }[];
  attention: {
    batchesNotOpened: { count: number; sample: { id: number; name: string }[] };
    staleRows: { count: number };
    missingUploads: { count: number };
  };
  documentTypeCounts: {
    documentTypeId: number;
    total: number;
    pending: number;
    collected: number;
    onHold: number;
  }[];
};

/**
 * Batches whose live eligible-promotion scope has grown beyond what's been
 * materialised into document_ledger — same predicate as
 * resolveBatchReceiptPromotionIds / listBatchReceipts in
 * document-batch-receipt.service.ts, expressed as a builder query so it can
 * share the correlated EXISTS checks via `exists()` instead of raw SQL.
 */
async function computeTopUpBacklog(): Promise<{
  rows: number;
  batches: number;
}> {
  const eligibleRows = await db
    .select({ batchId: documentBatchReceiptModel.id, eligible: count() })
    .from(documentBatchReceiptModel)
    .innerJoin(
      sessionModel,
      eq(sessionModel.academicYearId, documentBatchReceiptModel.academicYearId),
    )
    .innerJoin(
      promotionModel,
      and(
        eq(promotionModel.sessionId, sessionModel.id),
        eq(promotionModel.classId, documentBatchReceiptModel.classId),
      ),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .where(
      and(
        or(
          isNull(promotionModel.isDeprecated),
          eq(promotionModel.isDeprecated, false),
        ),
        eq(userModel.isActive, true),
        eq(documentBatchReceiptModel.isArchived, false),
        exists(
          db
            .select({ id: documentBatchReceiptProgramCourseModel.id })
            .from(documentBatchReceiptProgramCourseModel)
            .where(
              and(
                eq(
                  documentBatchReceiptProgramCourseModel.documentBatchReceiptId,
                  documentBatchReceiptModel.id,
                ),
                eq(
                  documentBatchReceiptProgramCourseModel.programCourseId,
                  promotionModel.programCourseId,
                ),
              ),
            ),
        ),
        or(
          isNull(documentBatchReceiptModel.appearTypeId),
          exists(
            db
              .select({ id: examFormFillupModel.id })
              .from(examFormFillupModel)
              .where(
                and(
                  eq(examFormFillupModel.id, promotionModel.examFormFillupId),
                  eq(
                    examFormFillupModel.appearTypeId,
                    documentBatchReceiptModel.appearTypeId,
                  ),
                ),
              ),
          ),
        ),
      ),
    )
    .groupBy(documentBatchReceiptModel.id);

  const materialisedRows = await db
    .select({
      batchId: documentLedgerModel.documentBatchReceiptId,
      total: count(),
    })
    .from(documentLedgerModel)
    .where(isNotNull(documentLedgerModel.documentBatchReceiptId))
    .groupBy(documentLedgerModel.documentBatchReceiptId);

  const materialisedMap = new Map<number, number>(
    materialisedRows.map((r) => [r.batchId as number, num(r.total)]),
  );

  let rows = 0;
  let batches = 0;
  for (const r of eligibleRows) {
    const total = materialisedMap.get(r.batchId) ?? 0;
    const eligible = num(r.eligible);
    if (eligible > total) {
      batches += 1;
      rows += eligible - total;
    }
  }
  return { rows, batches };
}

async function computeDailyActivity(): Promise<
  { date: string; collected: number; uploaded: number }[]
> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const windowStart = new Date(todayStart.getTime() - 29 * DAY_MS);

  const [collectedInWindow, uploadedInWindow] = await Promise.all([
    db
      .select({ at: documentLedgerModel.collectedAt })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "COLLECTED"),
          gte(documentLedgerModel.collectedAt, windowStart),
        ),
      ),
    db
      .select({ at: documentLedgerModel.createdAt })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "UPLOADED"),
          gte(documentLedgerModel.createdAt, windowStart),
        ),
      ),
  ]);

  const buckets = new Map<string, { collected: number; uploaded: number }>();
  for (let i = 0; i < 30; i++) {
    buckets.set(dayKey(new Date(windowStart.getTime() + i * DAY_MS)), {
      collected: 0,
      uploaded: 0,
    });
  }
  for (const row of collectedInWindow) {
    if (!row.at) continue;
    const bucket = buckets.get(dayKey(row.at));
    if (bucket) bucket.collected += 1;
  }
  for (const row of uploadedInWindow) {
    const bucket = buckets.get(dayKey(row.at));
    if (bucket) bucket.uploaded += 1;
  }
  return [...buckets.entries()].map(([date, v]) => ({ date, ...v }));
}

async function computeBatchesNotOpened(): Promise<
  { id: number; name: string }[]
> {
  const openBatches = await db
    .select({
      id: documentBatchReceiptModel.id,
      name: documentBatchReceiptModel.name,
    })
    .from(documentBatchReceiptModel)
    .where(eq(documentBatchReceiptModel.isArchived, false));

  if (openBatches.length === 0) return [];
  const batchIds = openBatches.map((b) => b.id);

  const modeRows = await db
    .select({
      batchId: documentBatchReceiptModeModel.documentBatchReceiptModeId,
      mode: documentBatchReceiptModeModel.mode,
      isEnabled: documentBatchReceiptModeModel.isEnabled,
    })
    .from(documentBatchReceiptModeModel)
    .where(
      inArray(
        documentBatchReceiptModeModel.documentBatchReceiptModeId,
        batchIds,
      ),
    );

  return openBatches.filter((b) => {
    const examLinked =
      modeRows.find((m) => m.batchId === b.id && m.mode === "EXAM_LINKED")
        ?.isEnabled ?? false;
    const admin =
      modeRows.find((m) => m.batchId === b.id && m.mode === "ADMINISTRATIVE")
        ?.isEnabled ?? false;
    return examLinked && !admin;
  });
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday.getTime() + DAY_MS);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

  const [
    statusRows,
    totalLedgerRows,
    collectedToday,
    collected7d,
    uploaded7d,
    onHold,
    pendingTotal,
    pendingBatchCount,
    topUp,
    dailyActivity,
    notOpened,
    staleRowsCount,
    missingUploadsCount,
    typeCountRows,
  ] = await Promise.all([
    db
      .select({ status: documentLedgerModel.status, count: count() })
      .from(documentLedgerModel)
      .groupBy(documentLedgerModel.status),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .then((r) => num(r[0]?.value)),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "COLLECTED"),
          gte(documentLedgerModel.collectedAt, startOfToday),
          lt(documentLedgerModel.collectedAt, startOfTomorrow),
        ),
      )
      .then((r) => num(r[0]?.value)),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "COLLECTED"),
          gte(documentLedgerModel.collectedAt, sevenDaysAgo),
        ),
      )
      .then((r) => num(r[0]?.value)),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "UPLOADED"),
          gte(documentLedgerModel.createdAt, sevenDaysAgo),
        ),
      )
      .then((r) => num(r[0]?.value)),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .where(eq(documentLedgerModel.status, "ON_HOLD"))
      .then((r) => num(r[0]?.value)),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .where(eq(documentLedgerModel.status, "PENDING"))
      .then((r) => num(r[0]?.value)),
    db
      .select({
        value: countDistinct(documentLedgerModel.documentBatchReceiptId),
      })
      .from(documentLedgerModel)
      .where(eq(documentLedgerModel.status, "PENDING"))
      .then((r) => num(r[0]?.value)),
    computeTopUpBacklog(),
    computeDailyActivity(),
    computeBatchesNotOpened(),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .innerJoin(
        promotionModel,
        eq(promotionModel.id, documentLedgerModel.promotionId),
      )
      .where(
        and(
          eq(documentLedgerModel.status, "PENDING"),
          eq(promotionModel.isDeprecated, true),
        ),
      )
      .then((r) => num(r[0]?.value)),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "PENDING"),
          eq(documentLedgerModel.isSelfSourced, true),
        ),
      )
      .then((r) => num(r[0]?.value)),
    db
      .select({
        documentTypeId: documentLedgerModel.documentTypeId,
        status: documentLedgerModel.status,
        count: count(),
      })
      .from(documentLedgerModel)
      .groupBy(documentLedgerModel.documentTypeId, documentLedgerModel.status),
  ]);

  const typeMap = new Map<
    number,
    {
      documentTypeId: number;
      total: number;
      pending: number;
      collected: number;
      onHold: number;
    }
  >();
  for (const r of typeCountRows) {
    const entry = typeMap.get(r.documentTypeId) ?? {
      documentTypeId: r.documentTypeId,
      total: 0,
      pending: 0,
      collected: 0,
      onHold: 0,
    };
    const c = num(r.count);
    entry.total += c;
    if (r.status === "PENDING") entry.pending += c;
    if (r.status === "COLLECTED") entry.collected += c;
    if (r.status === "ON_HOLD") entry.onHold += c;
    typeMap.set(r.documentTypeId, entry);
  }

  return {
    totals: {
      totalLedgerRows,
      collectedToday,
      collected7d,
      uploaded7d,
      onHold,
      pendingTotal,
      pendingBatchCount,
      topUpBacklogRows: topUp.rows,
      topUpBacklogBatches: topUp.batches,
    },
    statusCounts: statusRows.map((r) => ({
      status: r.status as LedgerStatus,
      count: num(r.count),
    })),
    dailyActivity,
    attention: {
      batchesNotOpened: {
        count: notOpened.length,
        sample: notOpened.slice(0, 6),
      },
      staleRows: { count: staleRowsCount },
      missingUploads: { count: missingUploadsCount },
    },
    documentTypeCounts: [...typeMap.values()],
  };
}

/* ------------------------------------------------------------------------- */
/*                                 Handovers                                 */
/* ------------------------------------------------------------------------- */

export type RecentHandoverRow = {
  ledgerId: number;
  status: "COLLECTED" | "UPLOADED";
  studentUid: string;
  studentName: string;
  documentTypeName: string;
  className: string | null;
  providedByName: string | null;
  at: Date;
};

export type TopProviderRow = {
  userId: number;
  name: string;
  count: number;
};

export type DashboardHandovers = {
  kpis: {
    collectedToday: number;
    collected7d: number;
    uploaded7d: number;
    selfSourcedUploadPct: number;
    peakDay: { date: string; count: number } | null;
  };
  recent: RecentHandoverRow[];
  topProviders: TopProviderRow[];
};

/** Shared select shape for both the COLLECTED and UPLOADED recent-handover queries. */
function recentHandoverSelection() {
  return db
    .select({
      ledgerId: documentLedgerModel.id,
      status: documentLedgerModel.status,
      collectedAt: documentLedgerModel.collectedAt,
      createdAt: documentLedgerModel.createdAt,
      studentUid: studentModel.uid,
      studentName: userModel.name,
      documentTypeName: documentTypeModel.name,
      className: classModel.name,
      providedByName: providerUserModel.name,
    })
    .from(documentLedgerModel)
    .innerJoin(
      documentTypeModel,
      eq(documentTypeModel.id, documentLedgerModel.documentTypeId),
    )
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, documentLedgerModel.promotionId),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
    .leftJoin(
      providerUserModel,
      eq(providerUserModel.id, documentLedgerModel.providedBy),
    );
}

/**
 * `limit` bounds how far back each status branch (COLLECTED / UPLOADED)
 * looks before the two are merged and re-sorted — not a page size. The
 * console paginates the merged `recent` list client-side, so this stays
 * generous enough to give that pagination real depth.
 */
export async function getDashboardHandovers(
  limit = 200,
): Promise<DashboardHandovers> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday.getTime() + DAY_MS);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

  const providerCount = count();

  const [
    collectedRecent,
    uploadedRecent,
    providerRows,
    collectedToday,
    collected7d,
    uploaded7d,
    selfSourcedUploaded7d,
    peakDayRows,
  ] = await Promise.all([
    recentHandoverSelection()
      .where(eq(documentLedgerModel.status, "COLLECTED"))
      .orderBy(
        desc(documentLedgerModel.collectedAt),
        desc(documentLedgerModel.id),
      )
      .limit(limit),
    recentHandoverSelection()
      .where(eq(documentLedgerModel.status, "UPLOADED"))
      .orderBy(
        desc(documentLedgerModel.createdAt),
        desc(documentLedgerModel.id),
      )
      .limit(limit),
    db
      .select({
        userId: providerUserModel.id,
        name: providerUserModel.name,
        count: providerCount,
      })
      .from(documentLedgerModel)
      .innerJoin(
        providerUserModel,
        eq(providerUserModel.id, documentLedgerModel.providedBy),
      )
      .where(
        and(
          eq(documentLedgerModel.status, "COLLECTED"),
          gte(documentLedgerModel.collectedAt, sevenDaysAgo),
        ),
      )
      .groupBy(providerUserModel.id, providerUserModel.name)
      .orderBy(desc(providerCount))
      .limit(10),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "COLLECTED"),
          gte(documentLedgerModel.collectedAt, startOfToday),
          lt(documentLedgerModel.collectedAt, startOfTomorrow),
        ),
      )
      .then((r) => num(r[0]?.value)),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "COLLECTED"),
          gte(documentLedgerModel.collectedAt, sevenDaysAgo),
        ),
      )
      .then((r) => num(r[0]?.value)),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "UPLOADED"),
          gte(documentLedgerModel.createdAt, sevenDaysAgo),
        ),
      )
      .then((r) => num(r[0]?.value)),
    db
      .select({ value: count() })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "UPLOADED"),
          eq(documentLedgerModel.isSelfSourced, true),
          gte(documentLedgerModel.createdAt, sevenDaysAgo),
        ),
      )
      .then((r) => num(r[0]?.value)),
    db
      .select({ at: documentLedgerModel.collectedAt })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.status, "COLLECTED"),
          gte(documentLedgerModel.collectedAt, sevenDaysAgo),
        ),
      ),
  ]);

  const recent = [...collectedRecent, ...uploadedRecent]
    .map((r) => ({
      ledgerId: r.ledgerId,
      status: r.status as "COLLECTED" | "UPLOADED",
      studentUid: r.studentUid,
      studentName: r.studentName,
      documentTypeName: r.documentTypeName,
      className: r.className,
      providedByName: r.providedByName,
      at: (r.collectedAt ?? r.createdAt) as Date,
    }))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);

  const peakBuckets = new Map<string, number>();
  for (const row of peakDayRows) {
    if (!row.at) continue;
    const key = dayKey(row.at);
    peakBuckets.set(key, (peakBuckets.get(key) ?? 0) + 1);
  }
  let peakDay: { date: string; count: number } | null = null;
  for (const [date, cnt] of peakBuckets) {
    if (!peakDay || cnt > peakDay.count) peakDay = { date, count: cnt };
  }

  return {
    kpis: {
      collectedToday,
      collected7d,
      uploaded7d,
      selfSourcedUploadPct:
        uploaded7d > 0
          ? Math.round((selfSourcedUploaded7d / uploaded7d) * 100)
          : 0,
      peakDay,
    },
    recent,
    topProviders: providerRows.map((r) => ({
      userId: r.userId,
      name: r.name,
      count: num(r.count),
    })),
  };
}

/* ------------------------------------------------------------------------- */
/*                              Fee-clearance                                */
/* ------------------------------------------------------------------------- */

export type BlockedStudentRow = {
  studentId: number;
  studentName: string;
  uid: string;
  rollNumber: string | null;
  programmeName: string | null;
  className: string | null;
  blockedCount: number;
  blockedDocTypes: string[];
  outstanding: number;
};

export type DashboardFeeClearance = {
  kpis: {
    onHoldRows: number;
    studentsBlocked: number;
    totalOutstanding: number;
  };
  blockedStudents: BlockedStudentRow[];
  blocksByDocType: { documentTypeId: number; name: string; count: number }[];
};

export async function getDashboardFeeClearance(
  limit = 50,
): Promise<DashboardFeeClearance> {
  const [onHoldRows, studentsBlocked, holdRows, feeMappingRows] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(documentLedgerModel)
        .where(eq(documentLedgerModel.status, "ON_HOLD"))
        .then((r) => num(r[0]?.value)),
      db
        .select({ value: countDistinct(promotionModel.studentId) })
        .from(documentLedgerModel)
        .innerJoin(
          promotionModel,
          eq(promotionModel.id, documentLedgerModel.promotionId),
        )
        .where(eq(documentLedgerModel.status, "ON_HOLD"))
        .then((r) => num(r[0]?.value)),

      // Un-grouped ON_HOLD rows with everything needed to build both the
      // per-student block list and the per-type breakdown — grouping/array-agg
      // happens in JS instead of SQL.
      db
        .select({
          studentId: studentModel.id,
          studentName: userModel.name,
          uid: studentModel.uid,
          rollNumber: studentModel.rollNumber,
          programmeShortName: programCourseModel.shortName,
          programmeName: programCourseModel.name,
          className: classModel.name,
          documentTypeId: documentTypeModel.id,
          documentTypeName: documentTypeModel.name,
        })
        .from(documentLedgerModel)
        .innerJoin(
          documentTypeModel,
          eq(documentTypeModel.id, documentLedgerModel.documentTypeId),
        )
        .innerJoin(
          promotionModel,
          eq(promotionModel.id, documentLedgerModel.promotionId),
        )
        .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
        .innerJoin(userModel, eq(userModel.id, studentModel.userId))
        .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
        .leftJoin(
          programCourseModel,
          eq(programCourseModel.id, promotionModel.programCourseId),
        )
        .where(eq(documentLedgerModel.status, "ON_HOLD")),

      // Same predicate as fee-clearance.service.ts#hasOutstandingFees, summed
      // per student instead of a boolean.
      db
        .select({
          studentId: feeStudentMappingModel.studentId,
          totalPayable: feeStudentMappingModel.totalPayable,
          amountPaid: feeStudentMappingModel.amountPaid,
          waivedOffAmount: feeStudentMappingModel.waivedOffAmount,
        })
        .from(feeStudentMappingModel)
        .where(eq(feeStudentMappingModel.isWaivedOff, false)),
    ]);

  const outstandingByStudent = new Map<number, number>();
  for (const r of feeMappingRows) {
    const balance =
      num(r.totalPayable) - num(r.amountPaid) - num(r.waivedOffAmount);
    if (balance <= 0) continue;
    outstandingByStudent.set(
      r.studentId,
      (outstandingByStudent.get(r.studentId) ?? 0) + balance,
    );
  }

  const studentMap = new Map<
    number,
    Omit<BlockedStudentRow, "blockedDocTypes" | "outstanding"> & {
      docTypes: Set<string>;
    }
  >();
  const typeCounts = new Map<
    number,
    { documentTypeId: number; name: string; count: number }
  >();

  for (const r of holdRows) {
    const entry = studentMap.get(r.studentId) ?? {
      studentId: r.studentId,
      studentName: r.studentName,
      uid: r.uid,
      rollNumber: r.rollNumber,
      programmeName: r.programmeShortName ?? r.programmeName,
      className: r.className,
      blockedCount: 0,
      docTypes: new Set<string>(),
    };
    entry.blockedCount += 1;
    entry.docTypes.add(r.documentTypeName);
    studentMap.set(r.studentId, entry);

    const typeEntry = typeCounts.get(r.documentTypeId) ?? {
      documentTypeId: r.documentTypeId,
      name: r.documentTypeName,
      count: 0,
    };
    typeEntry.count += 1;
    typeCounts.set(r.documentTypeId, typeEntry);
  }

  const blockedStudents = [...studentMap.values()]
    .map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      uid: s.uid,
      rollNumber: s.rollNumber,
      programmeName: s.programmeName,
      className: s.className,
      blockedCount: s.blockedCount,
      blockedDocTypes: [...s.docTypes].sort(),
      outstanding: outstandingByStudent.get(s.studentId) ?? 0,
    }))
    .sort((a, b) => b.blockedCount - a.blockedCount)
    .slice(0, limit);

  const totalOutstanding = [...studentMap.keys()].reduce(
    (acc, studentId) => acc + (outstandingByStudent.get(studentId) ?? 0),
    0,
  );

  return {
    kpis: { onHoldRows, studentsBlocked, totalOutstanding },
    blockedStudents,
    blocksByDocType: [...typeCounts.values()].sort((a, b) => b.count - a.count),
  };
}
