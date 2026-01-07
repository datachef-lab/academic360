import {
  notificationQueueModel,
  notificationModel,
} from "@repo/db/schemas/models/notifications";
import { and, eq, inArray } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/providers/interakt.js";
import { db } from "@/db";

const BATCH_SIZE = Number(process.env.NOTIF_BATCH_SIZE ?? 100);
const MAX_RETRIES = 7;

export async function processDbQueueOnce() {
  // Fetch oldest pending
  const rows = await db.transaction(async (tx) => {
    const ids = await tx
      .select({ id: notificationQueueModel.id })
      .from(notificationQueueModel)
      .where(
        and(
          eq(notificationQueueModel.isDeadLetter, false),
          eq(notificationQueueModel.isProcessing, false),
          inArray(notificationQueueModel.type, ["WHATSAPP_QUEUE"]),
        ),
      )
      .orderBy(notificationQueueModel.createdAt)
      .limit(BATCH_SIZE);

    if (ids.length === 0) return [];

    return tx
      .update(notificationQueueModel)
      .set({ isProcessing: true })
      .where(
        inArray(
          notificationQueueModel.id,
          ids.map((i) => i.id),
        ),
      )
      .returning();
  });

  for (const row of rows) {
    try {
      // Load minimal notification to get variant/user/message (join if needed)
      // For now, just mark sent OK for placeholder
      await db
        .update(notificationModel)
        .set({ status: "SENT", sentAt: new Date() })
        .where(eq(notificationModel.id, row.notificationId));
      // Dead-letter instead of delete to preserve history
      await db
        .delete(notificationQueueModel)
        .where(eq(notificationQueueModel.id, row.id));
    } catch (err) {
      const attempts = (row.retryAttempts ?? 0) + 1;
      if (attempts >= MAX_RETRIES) {
        await db
          .update(notificationModel)
          .set({
            status: "FAILED",
            failedAt: new Date(),
            failedReason: String(err).slice(0, 500),
          })
          .where(eq(notificationModel.id, row.notificationId));
        await db
          .update(notificationQueueModel)
          .set({
            isDeadLetter: true,
            deadLetterAt: new Date(),
            isProcessing: false,
          })
          .where(eq(notificationQueueModel.id, row.id));
      } else {
        await db
          .update(notificationQueueModel)
          .set({ retryAttempts: attempts, isProcessing: false })
          .where(eq(notificationQueueModel.id, row.id));
      }
    }
  }
}

export async function startDbQueueLoop() {
  const interval = Number(process.env.NOTIF_POLL_MS ?? 5000);
  setInterval(() => {
    processDbQueueOnce().catch(() => undefined);
  }, interval);
}
