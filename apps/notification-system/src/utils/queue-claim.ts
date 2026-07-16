import { notificationQueueModel } from "@repo/db/schemas/models/notifications";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";

type QueueType = "EMAIL_QUEUE" | "WHATSAPP_QUEUE";

/**
 * Atomically claim queue rows for a single worker instance.
 * Uses FOR UPDATE SKIP LOCKED so multiple pollers can run safely.
 */
export async function claimNotificationQueueRows(
  type: QueueType,
  batchSize: number,
) {
  return db.transaction(async (tx) => {
    const pending = await tx
      .select()
      .from(notificationQueueModel)
      .where(
        and(
          eq(notificationQueueModel.type, type as never),
          eq(notificationQueueModel.isDeadLetter, false),
          eq(notificationQueueModel.isProcessing, false),
        ),
      )
      .orderBy(notificationQueueModel.createdAt)
      .limit(batchSize)
      .for("update", { skipLocked: true });

    if (pending.length === 0) return [];

    const ids = pending.map((row) => row.id);

    return tx
      .update(notificationQueueModel)
      .set({ isProcessing: true })
      .where(inArray(notificationQueueModel.id, ids))
      .returning();
  });
}
