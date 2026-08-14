import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { libraryFineMappingModel } from "@repo/db/schemas/models/library/library-fine-mapping.model.js";
import { libraryFineSettingsModel } from "@repo/db/schemas/models/library/library-fine-settings.model.js";
import {
  resolveCurrentClassIdForUser,
  resolvePolicyForCirculation,
  type EffectivePolicy,
} from "@/features/library/services/circulation-policy-resolver.service.js";
import { countWorkingDaysBetween } from "@/features/library/services/holiday-calendar.service.js";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type FineComputation = {
  policy: EffectivePolicy;
  effectiveDue: Date;
  billableDays: number;
  fineAmount: number;
};

export type FineApplicationResult = {
  fineAmount: number;
  previousFineAmount: number;
  charged: boolean; // true when the fine transitioned 0 -> positive
  frozen: boolean; // true when a payment/waiver freeze prevented any write
};

// The go-live date is seeded by migration 0193 with now() per environment.
// Overdue days before it are forgiven by design: fines only accrue from the
// moment the feature landed in that environment (Harsh, 2026-08-14).
export async function getFineAccrualGoLiveDate(
  dbc: DbOrTx = db,
): Promise<Date> {
  const [row] = await dbc
    .select({ goLive: libraryFineSettingsModel.accrualGoLiveDate })
    .from(libraryFineSettingsModel)
    .limit(1);
  return row?.goLive ?? new Date();
}

export async function computeFineForCirculation(args: {
  userId: number;
  copyDetailsId: number;
  dueDate: Date;
  asOf: Date;
  goLive: Date;
  policy?: EffectivePolicy;
}): Promise<FineComputation> {
  const policy =
    args.policy ??
    (await resolvePolicyForCirculation(args.userId, args.copyDetailsId));
  const effectiveDue = args.goLive > args.dueDate ? args.goLive : args.dueDate;

  let billableDays = 0;
  let fineAmount = 0;
  if (args.asOf > effectiveDue && policy.finePerDay > 0) {
    let lateDays: number;
    if (policy.skipHolidaysInFine) {
      // Class-specific holidays only apply to students; for staff/faculty this
      // resolves to null and only org-wide holidays are subtracted.
      const classId = await resolveCurrentClassIdForUser(args.userId);
      lateDays = await countWorkingDaysBetween(
        effectiveDue,
        args.asOf,
        classId,
      );
    } else {
      // Raw calendar-day fine — policy opted out of holiday exclusion.
      const ms = args.asOf.getTime() - effectiveDue.getTime();
      lateDays = Math.max(0, Math.floor(ms / 86400000));
    }
    billableDays = Math.max(0, lateDays - policy.graceDays);
    fineAmount = billableDays * policy.finePerDay;
  }

  return { policy, effectiveDue, billableDays, fineAmount };
}

/**
 * Recomputes and stores the fine for one circulation as of `asOf`, writing the
 * ledger row (authoritative) and mirroring fine_amount/fine_date onto
 * book_circulation (display cache) in the same transaction.
 *
 * The write is an ABSOLUTE SET of a value derived purely from (due date, asOf,
 * policy, holidays) — never an increment — so re-running it any number of
 * times yields the same stored fine. That idempotency, not the scheduler's
 * advisory lock, is the real no-double-fine guarantee on the multi-instance
 * deployment.
 *
 * Freeze rules: once a payment is linked or the fine is fully waived on a
 * returned book, the stored amounts are history and are left untouched.
 */
export async function applyFineForCirculation(
  dbc: DbOrTx,
  args: {
    circulationId: number;
    userId: number;
    copyDetailsId: number;
    dueDate: Date;
    asOf: Date;
    goLive: Date;
  },
): Promise<FineApplicationResult> {
  const [existing] = await dbc
    .select({
      id: libraryFineMappingModel.id,
      fineAmount: libraryFineMappingModel.fineAmount,
      waivedAmount: libraryFineMappingModel.waivedAmount,
      paymentId: libraryFineMappingModel.paymentId,
      circulationPaymentId: bookCirculationModel.paymentId,
      circulationFineAmount: bookCirculationModel.fineAmount,
      isReturned: bookCirculationModel.isReturned,
    })
    .from(bookCirculationModel)
    .leftJoin(
      libraryFineMappingModel,
      eq(libraryFineMappingModel.bookCirculationId, bookCirculationModel.id),
    )
    .where(eq(bookCirculationModel.id, args.circulationId))
    .limit(1);

  const previousFineAmount =
    existing?.fineAmount ?? existing?.circulationFineAmount ?? 0;
  const paymentLinked =
    existing?.paymentId != null || existing?.circulationPaymentId != null;
  const fullyWaived =
    (existing?.waivedAmount ?? 0) > 0 &&
    (existing?.waivedAmount ?? 0) >= previousFineAmount;
  if (paymentLinked || (fullyWaived && existing?.isReturned)) {
    return {
      fineAmount: previousFineAmount,
      previousFineAmount,
      charged: false,
      frozen: true,
    };
  }

  const computed = await computeFineForCirculation({
    userId: args.userId,
    copyDetailsId: args.copyDetailsId,
    dueDate: args.dueDate,
    asOf: args.asOf,
    goLive: args.goLive,
  });

  if (computed.fineAmount <= 0 && previousFineAmount <= 0 && !existing?.id) {
    // Nothing accrued and no ledger row to keep in sync — skip the writes.
    return {
      fineAmount: 0,
      previousFineAmount: 0,
      charged: false,
      frozen: false,
    };
  }

  await dbc
    .insert(libraryFineMappingModel)
    .values({
      bookCirculationId: args.circulationId,
      userId: args.userId,
      policyId: computed.policy.policyId,
      finePerDaySnapshot: computed.policy.finePerDay,
      accruedFrom: computed.effectiveDue,
      accruedUpto: args.asOf,
      billableDays: computed.billableDays,
      fineAmount: computed.fineAmount,
    })
    .onConflictDoUpdate({
      target: libraryFineMappingModel.bookCirculationId,
      set: {
        policyId: computed.policy.policyId,
        finePerDaySnapshot: computed.policy.finePerDay,
        accruedFrom: computed.effectiveDue,
        accruedUpto: args.asOf,
        billableDays: computed.billableDays,
        fineAmount: computed.fineAmount,
        updatedAt: new Date(),
      },
    });

  await dbc
    .update(bookCirculationModel)
    .set({
      fineAmount: computed.fineAmount,
      fineDate:
        computed.fineAmount > 0
          ? previousFineAmount > 0
            ? undefined // keep the original charge date
            : args.asOf
          : null,
      updatedAt: new Date(),
    })
    .where(eq(bookCirculationModel.id, args.circulationId));

  return {
    fineAmount: computed.fineAmount,
    previousFineAmount,
    charged: previousFineAmount <= 0 && computed.fineAmount > 0,
    frozen: false,
  };
}

export type LibraryFineSchedulerState = {
  running: boolean;
  lastRunAt: Date | null;
  lastDurationMs: number | null;
  lastProcessed: number | null;
};

export async function writeFineSchedulerState(
  patch: Partial<LibraryFineSchedulerState>,
): Promise<void> {
  await db
    .update(libraryFineSettingsModel)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(libraryFineSettingsModel.onlyRow, true));
}

export async function readFineSchedulerState(): Promise<
  (LibraryFineSchedulerState & { accrualGoLiveDate: Date }) | null
> {
  const [row] = await db
    .select({
      running: libraryFineSettingsModel.running,
      lastRunAt: libraryFineSettingsModel.lastRunAt,
      lastDurationMs: libraryFineSettingsModel.lastDurationMs,
      lastProcessed: libraryFineSettingsModel.lastProcessed,
      accrualGoLiveDate: libraryFineSettingsModel.accrualGoLiveDate,
    })
    .from(libraryFineSettingsModel)
    .limit(1);
  return row ?? null;
}
