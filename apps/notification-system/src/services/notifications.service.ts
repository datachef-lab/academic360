import { getDbConnection } from "@repo/db/connection";
import {
  Notification,
  notificationModel,
  notificationQueueModel,
  notificationMasterModel,
  notificationMasterMetaModel,
  notificationMasterFieldModel,
  NotificationT,
} from "@repo/db/schemas/models/notifications";
import { notificationContentModel } from "@repo/db/schemas/models/notifications/notification-content.model";

// no FK imports needed here
import type { NotificationDto } from "@repo/db/dtos/notifications";
import { eq, inArray } from "drizzle-orm";
import { userModel } from "@repo/db/schemas/models/user";
import { db } from "@/db";

function resolveNotificationMasterId(dto: NotificationDto): number | null {
  // Top-level optional
  const maybeTop = dto as unknown as { notificationMasterId?: number | null };
  if (maybeTop && typeof maybeTop.notificationMasterId === "number") {
    return maybeTop.notificationMasterId;
  }
  // Nested notificationEvent.notificationMasterId
  const maybeEventId = dto as unknown as {
    notificationEvent?: { notificationMasterId?: number | null } | null;
  };
  if (
    maybeEventId?.notificationEvent &&
    typeof maybeEventId.notificationEvent.notificationMasterId === "number"
  ) {
    return maybeEventId.notificationEvent.notificationMasterId as number;
  }
  // Nested notificationEvent.notificationMaster.id
  const maybeEventMaster = dto as unknown as {
    notificationEvent?: {
      notificationMaster?: { id?: number | null } | null;
    } | null;
  };
  const id = maybeEventMaster?.notificationEvent?.notificationMaster?.id;
  return typeof id === "number" ? id : null;
}

export class NotificationsService {
  static async enqueue(
    dto: NotificationDto,
    options?: { meta?: Record<string, unknown> },
  ): Promise<number> {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    // Ensure user FK is valid in this DB; if not, set userId to null to avoid FK violation
    // To avoid cross-db FK issues, do not set user FK; store userId in content/meta later if needed
    let resolvedUserId: number | null = null;
    console.log("notification dto from controller:", dto);
    const [foundUser] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, dto.userId as number));
    if (foundUser) {
      resolvedUserId = foundUser.id;
    }

    console.log("foundUser:", foundUser, "resolvedUserId:", resolvedUserId);
    console.log(dto.content);

    // For WhatsApp notifications without fields, store bodyValues in message for worker access
    let message = dto.message;
    if (
      dto.variant === "WHATSAPP" &&
      dto.notificationEvent?.bodyValues &&
      dto.notificationEvent.bodyValues.length > 0
    ) {
      // Check if there are any notification fields defined
      const hasFields =
        dto.notificationEvent.notificationMaster?.meta?.length > 0;
      if (!hasFields) {
        // Store bodyValues in message field for worker to access
        message = JSON.stringify({
          originalMessage: dto.message,
          bodyValues: dto.notificationEvent.bodyValues,
        });
      }
    }

    const insertValues: Notification = {
      userId: resolvedUserId,
      applicationFormId: dto.applicationFormId ?? null,
      notificationMasterId: resolveNotificationMasterId(dto),
      notificationEventId: dto.notificationEvent?.id ?? null,
      variant: dto.variant,
      type: dto.type,
      message: message,
      status: "PENDING",
    };
    console.log("[notif-sys] enqueue insert values ->", insertValues);

    let notifRow: { id: number };
    try {
      const [row] = await db
        .insert(notificationModel)
        .values(insertValues)
        .returning({ id: notificationModel.id });
      notifRow = row;
    } catch (e: unknown) {
      console.log(e);
      const err = e as { code?: string; message?: string; detail?: string };
      console.error("[notif-sys] insert notification failed", {
        code: err?.code,
        message: err?.message,
        detail: (err as any)?.detail,
        values: insertValues,
      });
      throw e;
    }

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
      // Prefer backend-provided rows if present
      if (
        Array.isArray((dto as any).content) &&
        (dto as any).content.length > 0
      ) {
        const rows: ContentInsert[] = (dto as any).content.map((c: any) => ({
          notificationId: notifRow!.id,
          notificationEventId: (dto.notificationEvent?.id ??
            null) as unknown as number,
          whatsappFieldId: c.whatsappFieldId as number,
          emailTemplate: null,
          content: String(c.content ?? ""),
        }));
        await db.insert(notificationContentModel).values(rows as never);
      } else if (insertValues.notificationMasterId) {
        // Build one row per field (content = value)
        const emailRows: ContentInsert[] = [];
        const metas = await db
          .select({
            fieldId: notificationMasterMetaModel.notificationMasterFieldId,
            sequence: notificationMasterMetaModel.sequence,
            flag: notificationMasterMetaModel.flag,
          })
          .from(notificationMasterMetaModel)
          .where(
            eq(
              notificationMasterMetaModel.notificationMasterId,
              insertValues.notificationMasterId,
            ),
          );
        const activeMetas = metas
          .filter((m) => m.flag === true)
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        const fieldIds = activeMetas.map((m) => m.fieldId as number);
        if (fieldIds.length > 0) {
          const fields = await db
            .select({
              id: notificationMasterFieldModel.id,
              name: notificationMasterFieldModel.name,
            })
            .from(notificationMasterFieldModel)
            .where(inArray(notificationMasterFieldModel.id, fieldIds));
          const byId = new Map(
            fields.map((f) => [f.id as number, String(f.name)]),
          );
          const source = (dto.notificationEvent.templateData || {}) as Record<
            string,
            unknown
          >;
          for (const m of activeMetas) {
            const fname = byId.get(m.fieldId as number) || "";
            const value = String(source[fname] ?? "");
            emailRows.push({
              notificationId: notifRow!.id,
              notificationEventId: (dto.notificationEvent?.id ??
                null) as unknown as number,
              emailTemplate: null,
              whatsappFieldId: m.fieldId as unknown as number,
              content: value,
            });
          }
        }
        if (emailRows.length > 0) {
          await db.insert(notificationContentModel).values(emailRows as never);
        }
      }
    } else if (dto.variant === "WHATSAPP") {
      // Prefer backend-provided rows if present
      if (
        Array.isArray((dto as any).content) &&
        (dto as any).content.length > 0
      ) {
        const rows: ContentInsert[] = (dto as any).content.map((c: any) => ({
          notificationId: notifRow!.id,
          notificationEventId: (dto.notificationEvent?.id ??
            null) as unknown as number,
          whatsappFieldId: c.whatsappFieldId as number,
          emailTemplate: null,
          content: String(c.content ?? ""),
        }));
        await db.insert(notificationContentModel).values(rows as never);
      } else {
        // Build rows from Notification Master meta ordering and provided bodyValues
        console.log(
          "[notif-sys] (whatsapp) building content rows from meta and bodyValues",
        );
        console.log(
          "[notif-sys] (whatsapp) notificationEvent:",
          dto.notificationEvent,
        );
        console.log(
          "[notif-sys] (whatsapp) notificationEvent.id:",
          dto.notificationEvent?.id,
        );
        let meta = dto.notificationEvent.notificationMaster?.meta || [];
        const bodyValues = (dto.notificationEvent.bodyValues || []).slice();
        const rows: ContentInsert[] = [];
        // If meta not provided in DTO, fetch from DB using masterId
        if ((!meta || meta.length === 0) && insertValues.notificationMasterId) {
          const metas = await db
            .select({
              notificationMasterFieldId:
                notificationMasterMetaModel.notificationMasterFieldId,
              sequence: notificationMasterMetaModel.sequence,
              flag: notificationMasterMetaModel.flag,
            })
            .from(notificationMasterMetaModel)
            .where(
              eq(
                notificationMasterMetaModel.notificationMasterId,
                insertValues.notificationMasterId,
              ),
            );
          meta = metas as any;
        }
        const filteredMeta = (meta || [])
          .filter((m: any) => m.flag === true)
          .sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));
        for (const m of filteredMeta) {
          const value = bodyValues.length > 0 ? String(bodyValues.shift()) : "";
          rows.push({
            notificationId: notifRow!.id,
            notificationEventId: dto.notificationEvent.id,
            whatsappFieldId: m.notificationMasterFieldId as unknown as number,
            emailTemplate: null,
            content: value,
          });
        }
        // If no fields are defined, skip content row creation entirely
        // The worker will use the original bodyValues directly from the notification
        if (filteredMeta.length === 0) {
          console.log(
            "[notif-sys] (whatsapp) No notification fields defined, skipping content row creation",
          );
        }
        console.log("[notif-sys] built whatsapp content rows:", rows);
        if (rows.length > 0) {
          console.log(
            "[notif-sys] (whatsapp) inserting content rows into database...",
          );
          try {
            await db.insert(notificationContentModel).values(rows as never);
            console.log(
              "[notif-sys] (whatsapp) content rows inserted successfully",
            );
          } catch (error) {
            console.log(
              "[notif-sys] (whatsapp) ERROR inserting content rows:",
              error,
            );
            throw error;
          }
          console.log(
            "[notif-sys] (whatsapp) DEBUG: Content insertion complete, about to exit WhatsApp block",
          );
        } else {
          console.log("[notif-sys] (whatsapp) no content rows to insert");
        }
      }
    }

    console.log(
      "[notif-sys] (whatsapp) DEBUG: Exited WhatsApp content creation block, variant:",
      dto.variant,
    );
    // Safety: Ensure a queue row exists for this WhatsApp notification
    console.log(
      "[notif-sys] (whatsapp) DEBUG: About to check variant:",
      dto.variant,
    );
    if (dto.variant === "WHATSAPP") {
      console.log(
        "[notif-sys] (whatsapp) checking for existing queue row for notificationId:",
        notifRow!.id,
      );
      try {
        const existing = await db
          .select({ id: notificationQueueModel.id })
          .from(notificationQueueModel)
          .where(eq(notificationQueueModel.notificationId, notifRow!.id));
        console.log(
          "[notif-sys] (whatsapp) existing queue rows found:",
          existing,
        );

        if (!existing || existing.length === 0) {
          console.log(
            "[notif-sys] (whatsapp) no existing queue row, inserting new one...",
          );
          const inserted = await db
            .insert(notificationQueueModel)
            .values({
              notificationId: notifRow!.id,
              type: "WHATSAPP_QUEUE" as never,
            })
            .returning({
              id: notificationQueueModel.id,
              type: notificationQueueModel.type,
            });
          console.log(
            "[notif-sys] (whatsapp) queue inserted inline ->",
            inserted[0],
          );
        } else {
          console.log(
            "[notif-sys] (whatsapp) queue already present ->",
            existing[0],
          );
        }
      } catch (e) {
        console.log(
          "[notif-sys] (whatsapp) failed to ensure queue row:",
          (e as any)?.message || e,
          "stack:",
          (e as any)?.stack,
        );
      }
    }

    console.log(
      "[notif-sys] inserting general queue row with type:",
      queueType,
      "for notificationId:",
      notifRow!.id,
    );
    const insertedQueue = await db
      .insert(notificationQueueModel)
      .values({ notificationId: notifRow!.id, type: queueType as never })
      .returning({
        id: notificationQueueModel.id,
        type: notificationQueueModel.type,
      });
    console.log("[notif-sys] queue inserted ->", insertedQueue[0]);

    return notifRow!.id;
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
