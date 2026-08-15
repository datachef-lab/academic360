import { db, pool } from "@/db/index.js";
import { and, eq, lt } from "drizzle-orm";
import { createLogger } from "@/config/logger.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { libraryFineMappingModel } from "@repo/db/schemas/models/library/library-fine-mapping.model.js";
import {
  applyFineForCirculation,
  getFineAccrualGoLiveDate,
  writeFineSchedulerState,
} from "@/features/library/services/library-fine.service.js";
import { emitLibraryNotification } from "@/features/library/services/library-notifications.service.js";

const log = createLogger("library-fine-accrual");

const HOUR_MS = 60 * 60 * 1000;

// Advisory-lock key registry (see library-legacy-sync.service.ts):
// 918360001..005 and 918360007 are taken; 918360006 was the free slot.
const FINE_ACCRUAL_LOCK_KEY = 918360006;

export type FineAccrualSweepResult = {
  skipped?: string;
  scanned: number;
  updated: number;
  charged: number;
  frozen: number;
};

/**
 * Recomputes the fine for every open, overdue circulation. Each write is an
 * absolute SET derived from (due date, today, policy, holidays) — never an
 * increment — so the sweep is idempotent: N instances or N runs a day produce
 * the same stored fine. The advisory lock only avoids wasted duplicate work
 * on the multi-instance deployment; correctness never depends on it.
 */
export async function runFineAccrualSweep(): Promise<FineAccrualSweepResult> {
  const lockClient = await pool.connect();
  let holdsLock = false;
  const startedAt = Date.now();
  try {
    const lockRes = await lockClient.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [FINE_ACCRUAL_LOCK_KEY],
    );
    holdsLock = lockRes.rows[0]?.locked === true;
    if (!holdsLock) {
      return {
        skipped: "another instance is running the fine sweep",
        scanned: 0,
        updated: 0,
        charged: 0,
        frozen: 0,
      };
    }

    await writeFineSchedulerState({ running: true });

    const now = new Date();
    const goLive = await getFineAccrualGoLiveDate();

    // Open + past due. Rows whose ledger already carries a payment are still
    // selected but frozen inside applyFineForCirculation.
    const overdue = await db
      .select({
        id: bookCirculationModel.id,
        userId: bookCirculationModel.userId,
        copyDetailsId: bookCirculationModel.copyDetailsId,
        returnTimestamp: bookCirculationModel.returnTimestamp,
        ledgerPaymentId: libraryFineMappingModel.paymentId,
      })
      .from(bookCirculationModel)
      .leftJoin(
        libraryFineMappingModel,
        eq(libraryFineMappingModel.bookCirculationId, bookCirculationModel.id),
      )
      .where(
        and(
          eq(bookCirculationModel.isReturned, false),
          lt(bookCirculationModel.returnTimestamp, now),
        ),
      );

    let updated = 0;
    let charged = 0;
    let frozen = 0;
    for (const row of overdue) {
      if (row.ledgerPaymentId != null) {
        frozen++;
        continue;
      }
      try {
        const result = await applyFineForCirculation(db, {
          circulationId: row.id,
          userId: row.userId,
          copyDetailsId: row.copyDetailsId,
          dueDate: row.returnTimestamp,
          asOf: now,
          goLive,
        });
        if (result.frozen) {
          frozen++;
          continue;
        }
        if (result.fineAmount !== result.previousFineAmount) updated++;
        if (result.charged) {
          charged++;
          await emitLibraryNotification({
            event: "LIBRARY_FINE_CHARGED",
            userId: row.userId,
            variables: {
              circulationId: row.id,
              fineAmount: result.fineAmount,
            },
          });
        }
      } catch (err) {
        log.error("Fine accrual failed for circulation", {
          circulationId: row.id,
          err,
        });
      }
    }

    await writeFineSchedulerState({
      running: false,
      lastRunAt: now,
      lastDurationMs: Date.now() - startedAt,
      lastProcessed: overdue.length,
    });

    log.info("Fine accrual sweep complete", {
      scanned: overdue.length,
      updated,
      charged,
      frozen,
      durationMs: Date.now() - startedAt,
    });
    return { scanned: overdue.length, updated, charged, frozen };
  } finally {
    if (holdsLock) {
      await lockClient
        .query("SELECT pg_advisory_unlock($1)", [FINE_ACCRUAL_LOCK_KEY])
        .catch((err) => log.warn("Fine sweep unlock failed", { err }));
      await writeFineSchedulerState({ running: false }).catch(() => undefined);
    }
    lockClient.release();
  }
}

let schedulerHandle: NodeJS.Timeout | null = null;

export function startLibraryFineAccrualScheduler(): void {
  if (process.env.LIBRARY_FINE_ACCRUAL_ENABLED === "false") {
    log.info(
      "Library fine accrual scheduler disabled (LIBRARY_FINE_ACCRUAL_ENABLED=false)",
    );
    return;
  }
  if (schedulerHandle) return;

  void runFineAccrualSweep().catch((err) =>
    log.error("Initial fine accrual sweep failed", { err }),
  );

  schedulerHandle = setInterval(() => {
    void runFineAccrualSweep().catch((err) =>
      log.error("Fine accrual sweep failed", { err }),
    );
  }, 24 * HOUR_MS);

  log.info("Library fine accrual scheduler started (24h cadence)");
}
