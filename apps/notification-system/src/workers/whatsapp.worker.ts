import { getDbConnection } from "@repo/db/connection";
import {
  notificationQueueModel,
  notificationModel,
  notificationContentModel,
} from "@repo/db/schemas/models/notifications";
import { and, eq } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/providers/interakt.js";
import type {
  NotificationEventDto,
  TemplateData,
} from "@repo/db/dtos/notifications";

const POLL_MS = Number(process.env.WHATSAPP_POLL_MS ?? 3000);
const BATCH_SIZE = Number(process.env.WHATSAPP_BATCH_SIZE ?? 50);
const RATE_DELAY_MS = Number(process.env.WHATSAPP_RATE_DELAY_MS ?? 300);
const MAX_RETRIES = Number(process.env.WHATSAPP_MAX_RETRIES ?? 5);

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}
function asStringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
    ? value
    : fallback;
}
function readFromTemplateData(
  data: TemplateData | undefined,
  key: string,
): string | undefined {
  if (!data) return undefined;
  const val = (data as Record<string, unknown>)[key];
  if (val == null) return undefined;
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    return String(val);
  }
  return undefined;
}

async function processBatch() {
  const db = getDbConnection(process.env.DATABASE_URL!);
  const rows = await db
    .select()
    .from(notificationQueueModel)
    .where(eq(notificationQueueModel.type, "WHATSAPP_QUEUE" as any))
    .limit(BATCH_SIZE);

  for (const row of rows) {
    try {
      const [notif] = await db
        .select()
        .from(notificationModel)
        .where(eq(notificationModel.id, row.notificationId))
        .limit(1);
      const { userModel } = await import("@repo/db/schemas/models/user");
      const [user] = await db
        .select()
        .from(userModel)
        .where(eq(userModel.id, notif.userId as number))
        .limit(1);

      const [content] = await db
        .select()
        .from(notificationContentModel)
        .where(eq(notificationContentModel.notificationId, row.notificationId))
        .limit(1);

      const dto: NotificationEventDto = content?.content
        ? JSON.parse(String(content.content))
        : ({} as NotificationEventDto);
      const env = String(process.env.NODE_ENV || "development");
      const devOnlyMeta = Boolean(dto?.meta?.devOnly);
      const templateName = asString(
        dto?.notificationMaster?.template,
        "generic_alert",
      );
      // Build body values using WhatsappFieldMetaT entries as the canonical sequence
      const contents = await db
        .select()
        .from(notificationContentModel)
        .where(eq(notificationContentModel.notificationId, row.notificationId));
      const wc = contents
        .filter((c) => typeof c.whatsappFieldId === "number")
        .sort(
          (a, b) =>
            (a.createdAt?.getTime?.() || 0) - (b.createdAt?.getTime?.() || 0),
        );
      const mapFieldToContents = new Map<number, { content: string }[]>();
      for (const c of wc) {
        const fid = c.whatsappFieldId as number;
        const arr = mapFieldToContents.get(fid) || [];
        arr.push({ content: asString(c.content, "") });
        mapFieldToContents.set(fid, arr);
      }
      // Use WhatsApp Alert Meta (design-driven ordering and gating)
      const metaEntries = (dto?.notificationMaster?.meta || [])
        .map((m, idx) => ({ ...m, __i: idx }))
        .filter((m) => m.flag === true)
        .sort((a, b) => (a.sequence || 0) - (b.sequence || 0) || a.__i - b.__i);
      const bodyValues: string[] = [];
      for (const m of metaEntries) {
        const arr = mapFieldToContents.get(m.notificationMasterFieldId) || [];
        const next = arr.shift();
        bodyValues.push(next?.content ?? "");
        mapFieldToContents.set(m.notificationMasterFieldId, arr);
      }
      // If still empty, fallback to explicit bodyValues provided
      if (bodyValues.length === 0) {
        const fallback = asStringArray(dto?.bodyValues, []);
        for (const v of fallback) bodyValues.push(v);
      }

      if (env === "staging") {
        // Fan-out to all STAFF who opted-in
        const staffUsers = await db
          .select()
          .from(userModel)
          .where(
            and(
              eq(userModel.type, "STAFF" as never),
              eq(userModel.sendStagingNotifications, true),
            ),
          )
          .limit(500);
        if (staffUsers.length > 0) {
          for (const staff of staffUsers) {
            const recipient = asString(
              staff.whatsappNumber || staff.phone,
              process.env.DEVELOPER_PHONE!,
            );
            const resp = await sendWhatsAppMessage(
              recipient,
              bodyValues,
              templateName,
              dto.whatsappHeaderMediaUrl,
            );
            if (!resp.ok) throw new Error(resp.error);
            await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
          }
        } else {
          const resp = await sendWhatsAppMessage(
            process.env.DEVELOPER_PHONE!,
            bodyValues,
            templateName,
            dto.whatsappHeaderMediaUrl,
          );
          if (!resp.ok) throw new Error(resp.error);
          await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
        }
      } else {
        const devOnly = env === "development" ? true : devOnlyMeta;
        const resolvedPhone = devOnly
          ? process.env.DEVELOPER_PHONE!
          : asString(
              user?.whatsappNumber || user?.phone,
              process.env.DEVELOPER_PHONE!,
            );
        const resp = await sendWhatsAppMessage(
          resolvedPhone,
          bodyValues,
          templateName,
          dto.whatsappHeaderMediaUrl,
        );
        if (!resp.ok) throw new Error(resp.error);
        await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
      }

      await db
        .update(notificationModel)
        .set({ status: "SENT", sentAt: new Date() })
        .where(eq(notificationModel.id, row.notificationId));
      await db
        .delete(notificationQueueModel)
        .where(eq(notificationQueueModel.id, row.id));

      await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
    } catch (err: any) {
      const db = getDbConnection(process.env.DATABASE_URL!);
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
          .delete(notificationQueueModel)
          .where(eq(notificationQueueModel.id, row.id));
      } else {
        await db
          .update(notificationQueueModel)
          .set({ retryAttempts: attempts })
          .where(eq(notificationQueueModel.id, row.id));
      }
    }
  }
}

export function startWhatsAppWorker() {
  setInterval(() => {
    processBatch().catch(() => undefined);
  }, POLL_MS);
}
