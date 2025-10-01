import { getDbConnection } from "@repo/db/connection";
import {
  notificationModel,
  notificationQueueModel,
} from "@repo/db/schemas/models/notifications";
import { notificationContentModel } from "@repo/db/schemas/models/notifications/notification-content.model";
import type { NotificationDto } from "@repo/db/dtos/notifications";
import { eq } from "drizzle-orm";

export class NotificationsService {
  static async enqueue(
    dto: NotificationDto,
    options?: { meta?: Record<string, unknown> },
  ): Promise<number> {
    const db = getDbConnection(process.env.DATABASE_URL!);

    const [notif] = await db
      .insert(notificationModel)
      .values({
        userId: dto.userId,
        applicationFormId: dto.applicationFormId ?? null,
        notificationEventId: dto.notificationEvent?.id ?? null,
        variant: dto.variant,
        type: dto.type,
        message: dto.message,
        status: "PENDING",
      })
      .returning({ id: notificationModel.id });

    // Persist meta in notification only; content rows for WhatsApp should be created upstream
    // by the backend based on whatsapp fields/meta design.

    const queueType =
      dto.variant === "WHATSAPP"
        ? "WHATSAPP_QUEUE"
        : dto.variant === "EMAIL"
          ? "EMAIL_QUEUE"
          : dto.variant === "WEB"
            ? "WEB_QUEUE"
            : dto.variant === "SMS"
              ? "SMS_QUEUE"
              : "IN_APP_QUEUE";

    // Persist notification content rows based on channel
    type ContentInsert = typeof notificationContentModel.$inferInsert;
    if (dto.variant === "EMAIL") {
      const emailTemplate = dto.notificationEvent.emailTemplate ?? null;
      const emailRows: ContentInsert[] = [];
      if (emailTemplate) {
        emailRows.push({
          notificationId: notif.id,
          notificationEventId: dto.notificationEvent.id,
          emailTemplate,
          whatsappFieldId: 0 as unknown as number,
          content: JSON.stringify({
            templateData: dto.notificationEvent.templateData ?? {},
            subject: dto.notificationEvent.subject ?? null,
            emailTemplate,
          }),
        });
      }
      if (emailRows.length > 0) {
        await db.insert(notificationContentModel).values(emailRows as never);
      }
    } else if (dto.variant === "WHATSAPP") {
      // Build rows from Notification Master meta ordering and provided bodyValues
      const meta = dto.notificationEvent.notificationMaster?.meta || [];
      const bodyValues = (dto.notificationEvent.bodyValues || []).slice();
      const rows: ContentInsert[] = [];
      const filteredMeta = meta
        .filter((m): m is (typeof meta)[number] => m.flag === true)
        .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      for (const m of filteredMeta) {
        const value = bodyValues.length > 0 ? String(bodyValues.shift()) : "";
        rows.push({
          notificationId: notif.id,
          notificationEventId: dto.notificationEvent.id,
          whatsappFieldId: m.notificationMasterFieldId as unknown as number,
          emailTemplate: null,
          content: value,
        });
      }
      if (rows.length > 0) {
        await db.insert(notificationContentModel).values(rows as never);
      }
    }

    await db.insert(notificationQueueModel).values({
      notificationId: notif.id,
      type: queueType as never,
    });

    return notif.id;
  }

  static async markSent(notificationId: number) {
    const db = getDbConnection(process.env.DATABASE_URL!);
    await db
      .update(notificationModel)
      .set({ status: "SENT", sentAt: new Date() })
      .where(eq(notificationModel.id, notificationId));
  }

  static async markFailed(notificationId: number, reason: string) {
    const db = getDbConnection(process.env.DATABASE_URL!);
    await db
      .update(notificationModel)
      .set({
        status: "FAILED",
        failedAt: new Date(),
        failedReason: reason.slice(0, 500),
      })
      .where(eq(notificationModel.id, notificationId));
  }
}
