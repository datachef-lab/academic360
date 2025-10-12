// NOTE: Avoid per-iteration client creation; reuse shared db instance
import {
  notificationQueueModel,
  notificationModel,
  notificationContentModel,
} from "@repo/db/schemas/models/notifications";
import { and, eq, inArray } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/providers/interakt.js";
import type {
  NotificationEventDto,
  TemplateData,
} from "@repo/db/dtos/notifications";
import {
  notificationMasterModel,
  notificationMasterMetaModel,
} from "@repo/db/schemas/models/notifications";
import { db } from "@/db";

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
  const rows = await db
    .select()
    .from(notificationQueueModel)
    .where(
      and(
        eq(notificationQueueModel.type, "WHATSAPP_QUEUE" as any),
        eq(notificationQueueModel.isDeadLetter, false as any),
      ),
    )
    .limit(BATCH_SIZE);
  if (rows.length === 0) {
    return;
  }

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

      // Safely parse JSON only if the first non-whitespace char suggests JSON
      let dto: NotificationEventDto = {} as NotificationEventDto;
      if (content && typeof content.content === "string") {
        const trimmed = String(content.content).trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            dto = JSON.parse(trimmed) as NotificationEventDto;
          } catch (e: any) {
            console.log(
              "[whatsapp.worker] skipped non-JSON content for dto due to parse error:",
              e?.message || String(e),
            );
            dto = {} as NotificationEventDto;
          }
        }
      }
      const env = String(process.env.NODE_ENV || "development");
      const devOnlyMeta = Boolean(dto?.meta?.devOnly);
      // Resolve template via notification master id (preferred), fallback to dto
      let templateName = asString(
        dto?.notificationMaster?.template,
        "generic_alert",
      );
      if (notif.notificationMasterId) {
        const [master] = await db
          .select()
          .from(notificationMasterModel)
          .where(eq(notificationMasterModel.id, notif.notificationMasterId))
          .limit(1);
        console.log(
          "[whatsapp.worker] master check =>",
          JSON.stringify({
            id: notif.notificationMasterId,
            isActive: master?.isActive,
            template: master?.template,
          }),
        );
        if (!master?.isActive) {
          await db
            .update(notificationModel)
            .set({
              status: "FAILED",
              failedAt: new Date(),
              failedReason: "Notification master inactive",
            })
            .where(eq(notificationModel.id, row.notificationId));
          await db
            .update(notificationQueueModel)
            .set({
              isDeadLetter: true,
              deadLetterAt: new Date(),
              failedReason: "Notification master inactive",
            })
            .where(eq(notificationQueueModel.id, row.id));
          continue;
        }
        if (master?.template) templateName = String(master.template);
      }

      // Build body values using DB meta as the canonical sequence
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
      // Use DB Meta (design-driven ordering and gating)
      let metaEntries: {
        notificationMasterFieldId: number;
        sequence: number;
      }[] = [];
      if (notif.notificationMasterId) {
        const metas = await db
          .select()
          .from(notificationMasterMetaModel)
          .where(
            and(
              eq(
                notificationMasterMetaModel.notificationMasterId,
                notif.notificationMasterId,
              ),
              eq(notificationMasterMetaModel.flag, true),
            ),
          );
        metaEntries = metas
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
          .map((m) => ({
            notificationMasterFieldId: m.notificationMasterFieldId as number,
            sequence: m.sequence as number,
          }));
      }
      const bodyValues: string[] = [];
      for (const m of metaEntries) {
        const arr = mapFieldToContents.get(m.notificationMasterFieldId) || [];
        const next = arr.shift();
        bodyValues.push(next?.content ?? "");
        mapFieldToContents.set(m.notificationMasterFieldId, arr);
      }
      // If none or only blank values, fallback to explicit bodyValues provided
      const allBlank =
        bodyValues.length === 0 ||
        bodyValues.every((v) => String(v).trim().length === 0);
      if (allBlank) {
        // replace with provided dto body values
        bodyValues.length = 0;
        const fallback = asStringArray(dto?.bodyValues, []);
        for (const v of fallback) bodyValues.push(v);
      }
      // Final fallback: if still empty, try to get bodyValues from notification message
      if (bodyValues.length === 0) {
        try {
          // Check if message contains bodyValues (for notifications without fields)
          const messageData = JSON.parse(notif.message || "{}");
          if (messageData.bodyValues && Array.isArray(messageData.bodyValues)) {
            for (const v of messageData.bodyValues) bodyValues.push(String(v));
          }
        } catch (e) {
          // If parsing fails, leave bodyValues empty
          console.log(
            "[whatsapp.worker] Could not parse bodyValues from message:",
            e,
          );
        }
      }

      // Guard: ensure required placeholders have values; otherwise throw before provider call
      const expectedCount = metaEntries.length;
      const providedCount = bodyValues.filter(
        (v) => String(v).length > 0,
      ).length;
      if (expectedCount > 0 && providedCount < expectedCount) {
        throw new Error(
          `Missing variable values for template's body, expected ${expectedCount}, got ${providedCount}`,
        );
      }

      if (env === "staging") {
        // Fan-out to all STAFF who opted-in and are active/not suspended
        const staffUsers = await db
          .select()
          .from(userModel)
          .where(
            and(
              eq(userModel.type, "STAFF"),
              eq(userModel.sendStagingNotifications, true),
              eq(userModel.isActive, true),
              eq(userModel.isSuspended, false),
            ),
          )
          .limit(500);
        if (staffUsers.length > 0) {
          for (const staff of staffUsers) {
            const recipient = asString(
              staff.whatsappNumber || staff.phone,
              process.env.DEVELOPER_PHONE!,
            );
            console.log("[whatsapp.worker] sending =>", {
              notifId: row.notificationId,
              to: recipient,
              templateName,
              bodyValues,
              headerMediaUrl: dto.whatsappHeaderMediaUrl,
            });
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
          console.log("[whatsapp.worker] sending =>", {
            notifId: row.notificationId,
            to: process.env.DEVELOPER_PHONE!,
            templateName,
            bodyValues,
            headerMediaUrl: dto.whatsappHeaderMediaUrl,
          });
          const resp = await sendWhatsAppMessage(
            process.env.DEVELOPER_PHONE!,
            bodyValues,
            templateName,
            dto.whatsappHeaderMediaUrl,
          );
          if (!resp.ok) throw new Error(resp.error);
          await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
        }
      } else if (env === "development") {
        // development -> always send to developer
        const resolvedPhone = process.env.DEVELOPER_PHONE!;
        console.log("[whatsapp.worker] sending =>", {
          notifId: row.notificationId,
          to: resolvedPhone,
          templateName,
          bodyValues,
          headerMediaUrl: dto.whatsappHeaderMediaUrl,
        });
        const resp = await sendWhatsAppMessage(
          resolvedPhone,
          bodyValues,
          templateName,
          dto.whatsappHeaderMediaUrl,
        );
        if (!resp.ok) throw new Error(resp.error);
        await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
      } else {
        // production -> send to real user
        const resolvedPhone = asString(
          user?.whatsappNumber || user?.phone,
          process.env.DEVELOPER_PHONE!,
        );
        console.log("[whatsapp.worker] sending =>", {
          notifId: row.notificationId,
          to: resolvedPhone,
          templateName,
          bodyValues,
          headerMediaUrl: dto.whatsappHeaderMediaUrl,
        });
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
        .update(notificationQueueModel)
        .set({ isDeadLetter: true, deadLetterAt: new Date() })
        .where(eq(notificationQueueModel.id, row.id));

      console.log("[whatsapp.worker] sent ->", {
        notifId: row.notificationId,
        to:
          env === "development"
            ? process.env.DEVELOPER_PHONE
            : user?.whatsappNumber || user?.phone,
      });

      await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
    } catch (err: any) {
      // Reuse shared db; do not create new clients inside the loop
      const attempts = (row.retryAttempts ?? 0) + 1;

      // Extract proper error message (provider returns cleaned message)
      let errorMessage = "Unknown error";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err && typeof err === "object") {
        errorMessage = (err as any).message || String(err);
      }

      if (attempts >= MAX_RETRIES) {
        await db
          .update(notificationModel)
          .set({
            status: "FAILED",
            failedAt: new Date(),
            failedReason: errorMessage,
          })
          .where(eq(notificationModel.id, row.notificationId));
        await db
          .update(notificationQueueModel)
          .set({
            isDeadLetter: true,
            deadLetterAt: new Date(),
            failedReason: errorMessage,
          })
          .where(eq(notificationQueueModel.id, row.id));
      } else {
        await db
          .update(notificationQueueModel)
          .set({ retryAttempts: attempts, failedReason: errorMessage })
          .where(eq(notificationQueueModel.id, row.id));
      }
    }
  }
}

let workerInterval: NodeJS.Timeout | null = null;
let isWorkerRunning = false;

export function startWhatsAppWorker() {
  if (isWorkerRunning) {
    console.log("[whatsapp.worker] Worker already running, skipping start");
    return;
  }

  isWorkerRunning = true;
  console.log(
    `[whatsapp.worker] starting with POLL_MS=${POLL_MS}, BATCH_SIZE=${BATCH_SIZE}, RATE_DELAY_MS=${RATE_DELAY_MS}, MAX_RETRIES=${MAX_RETRIES}`,
  );

  // Kick off immediately for visibility
  processBatch()
    .then(() => console.log("[whatsapp.worker] initial run complete"))
    .catch((e) =>
      console.log("[whatsapp.worker] initial run error:", e?.message || e),
    );

  workerInterval = setInterval(() => {
    processBatch().catch(() => undefined);
  }, POLL_MS);
}

export function stopWhatsAppWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
  isWorkerRunning = false;
  console.log("[whatsapp.worker] Worker stopped");
}
