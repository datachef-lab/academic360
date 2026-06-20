import { db } from "@/db/index.js";
import { and, between, eq, gt, isNull, lt } from "drizzle-orm";
import { createLogger } from "@/config/logger.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { emitLibraryNotification } from "@/features/library/services/library-notifications.service.js";

const log = createLogger("library-reminders");

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const startOfUtcDay = (d: Date) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

export async function runLibraryReminderSweep(): Promise<void> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const threeDaysStart = new Date(todayStart.getTime() + 3 * DAY_MS);
  const threeDaysEnd = new Date(threeDaysStart.getTime() + DAY_MS);

  const dueSoon = await db
    .select({
      id: bookCirculationModel.id,
      userId: bookCirculationModel.userId,
      returnTimestamp: bookCirculationModel.returnTimestamp,
    })
    .from(bookCirculationModel)
    .where(
      and(
        eq(bookCirculationModel.isReturned, false),
        between(
          bookCirculationModel.returnTimestamp,
          threeDaysStart,
          threeDaysEnd,
        ),
      ),
    );
  for (const r of dueSoon) {
    await emitLibraryNotification({
      event: "LIBRARY_DUE_IN_3_DAYS",
      userId: r.userId,
      variables: {
        circulationId: r.id,
        returnTimestamp: r.returnTimestamp.toISOString(),
      },
    });
  }

  const overdue = await db
    .select({
      id: bookCirculationModel.id,
      userId: bookCirculationModel.userId,
      returnTimestamp: bookCirculationModel.returnTimestamp,
    })
    .from(bookCirculationModel)
    .where(
      and(
        eq(bookCirculationModel.isReturned, false),
        lt(bookCirculationModel.returnTimestamp, todayStart),
      ),
    );
  for (const r of overdue) {
    await emitLibraryNotification({
      event: "LIBRARY_OVERDUE",
      userId: r.userId,
      variables: {
        circulationId: r.id,
        returnTimestamp: r.returnTimestamp.toISOString(),
      },
    });
  }

  log.info("Library reminder sweep complete", {
    dueSoon: dueSoon.length,
    overdue: overdue.length,
  });
}

export function startLibraryReminderScheduler(): void {
  if (process.env.LIBRARY_REMINDER_CRON_ENABLED === "false") {
    log.info(
      "Library reminder scheduler disabled (LIBRARY_REMINDER_CRON_ENABLED=false)",
    );
    return;
  }

  void runLibraryReminderSweep().catch((err) =>
    log.error("Initial reminder sweep failed", { err }),
  );

  setInterval(() => {
    void runLibraryReminderSweep().catch((err) =>
      log.error("Reminder sweep failed", { err }),
    );
  }, 24 * HOUR_MS);

  log.info("Library reminder scheduler started (24h cadence)");
}
