/**
 * Predictive serial-arrival scheduler.
 *
 * For each active journal_subscription with a recognisable frequency, finds the
 * latest expected_date among that subscription's existing journal_issues. If
 * that date has passed and no follow-up row exists yet, inserts a new
 * placeholder issue at (latest + cadence) with NULL receivedDate.
 *
 * Runs alongside the existing reminder sweep (`library-reminders.scheduler.ts`)
 * on a 24-hour cadence. Disabled by env LIBRARY_REMINDER_CRON_ENABLED=false to
 * match the existing toggle.
 *
 * The endpoint /api/library/journal-subscriptions/missing-issues then picks up
 * any of these placeholders that pass their expectedDate without a receivedDate
 * so a librarian can claim them from the vendor.
 */

import { db } from "@/db/index.js";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { createLogger } from "@/config/logger.js";
import { journalSubscriptionModel } from "@repo/db/schemas/models/library/journal-subscription.model.js";
import { journalIssueModel } from "@repo/db/schemas/models/library/journal-issue.model.js";

const log = createLogger("library-serial-predictor");

const DAY_MS = 24 * 60 * 60 * 1000;

const FREQUENCY_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  fortnightly: 14,
  monthly: 30,
  bimonthly: 60,
  quarterly: 90,
  "semi-annual": 182,
  semiannual: 182,
  biannual: 182,
  annual: 365,
  yearly: 365,
};

function cadenceForFrequency(freq: string | null | undefined): number | null {
  if (!freq) return null;
  const key = freq.trim().toLowerCase();
  return FREQUENCY_DAYS[key] ?? null;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function runJournalIssuePredictorSweep(): Promise<void> {
  const now = new Date();
  const subs = await db
    .select({
      id: journalSubscriptionModel.id,
      frequency: journalSubscriptionModel.frequency,
      startDate: journalSubscriptionModel.startDate,
      endDate: journalSubscriptionModel.endDate,
      isActive: journalSubscriptionModel.isActive,
    })
    .from(journalSubscriptionModel)
    .where(eq(journalSubscriptionModel.isActive, true));

  let created = 0;
  for (const sub of subs) {
    const cadence = cadenceForFrequency(sub.frequency);
    if (!cadence) continue;

    // Skip if the subscription window has ended.
    if (sub.endDate) {
      const end = new Date(sub.endDate);
      if (!Number.isNaN(end.getTime()) && end < now) continue;
    }

    // Find the latest expectedDate for this subscription.
    const [latest] = await db
      .select({
        expectedDate: journalIssueModel.expectedDate,
      })
      .from(journalIssueModel)
      .where(
        and(
          eq(journalIssueModel.subscriptionId, sub.id),
          isNotNull(journalIssueModel.expectedDate),
        ),
      )
      .orderBy(desc(journalIssueModel.expectedDate))
      .limit(1);

    const lastExpected = latest?.expectedDate
      ? new Date(latest.expectedDate)
      : sub.startDate
        ? new Date(sub.startDate)
        : null;
    if (!lastExpected || Number.isNaN(lastExpected.getTime())) continue;

    // If the most-recent expected date is still in the future, nothing to do.
    if (lastExpected.getTime() > now.getTime()) continue;

    const nextExpected = new Date(lastExpected.getTime() + cadence * DAY_MS);
    // Don't seed past the subscription window.
    if (sub.endDate) {
      const end = new Date(sub.endDate);
      if (!Number.isNaN(end.getTime()) && nextExpected > end) continue;
    }

    await db
      .insert(journalIssueModel)
      .values({
        subscriptionId: sub.id,
        issueNumber: `AUTO-${isoDay(nextExpected)}`,
        expectedDate: isoDay(nextExpected),
        receivedDate: null,
      })
      .onConflictDoNothing();
    created++;
  }

  log.info("Journal issue predictor sweep complete", {
    subscriptions: subs.length,
    created,
  });
}

export function startJournalIssuePredictorScheduler(): void {
  if (process.env.LIBRARY_REMINDER_CRON_ENABLED === "false") {
    log.info(
      "Journal issue predictor disabled (LIBRARY_REMINDER_CRON_ENABLED=false)",
    );
    return;
  }
  void runJournalIssuePredictorSweep().catch((err) =>
    log.error("Initial predictor sweep failed", { err }),
  );
  setInterval(
    () => {
      void runJournalIssuePredictorSweep().catch((err) =>
        log.error("Predictor sweep failed", { err }),
      );
    },
    24 * 60 * 60 * 1000,
  );
  log.info("Journal issue predictor scheduler started (24h cadence)");
}
