import { getDbConnection } from "@repo/db/connection";
import {
  notificationQueueModel,
  notificationModel,
  notificationContentModel,
} from "@repo/db/schemas/models/notifications";
import { and, eq } from "drizzle-orm";
import { sendZeptoMail } from "@/providers/zepto.js";
import type { NotificationEventDto } from "@repo/db/dtos/notifications";
import { renderTemplateFile, renderTemplateString } from "@/utils/templates.js";

const POLL_MS = Number(process.env.EMAIL_POLL_MS ?? 3000);
const BATCH_SIZE = Number(process.env.EMAIL_BATCH_SIZE ?? 50);
const RATE_DELAY_MS = Number(process.env.EMAIL_RATE_DELAY_MS ?? 250);
const MAX_RETRIES = Number(process.env.EMAIL_MAX_RETRIES ?? 5);

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

async function processBatch() {
  const db = getDbConnection(process.env.DATABASE_URL!);
  const rows = await db
    .select()
    .from(notificationQueueModel)
    .where(eq(notificationQueueModel.type, "EMAIL_QUEUE"))
    .limit(BATCH_SIZE);

  for (const row of rows) {
    try {
      const [notif] = await db
        .select()
        .from(notificationModel)
        .where(eq(notificationModel.id, row.notificationId))
        .limit(1);
      // Fetch user to allow STAFF bypass for devOnly
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
      const subject = dto?.subjectTemplate
        ? await renderTemplateString(dto.subjectTemplate, {
            notif,
            content: dto,
          })
        : asString(dto?.subject, "Notification");
      const templateKey = dto.emailTemplate;
      const html = templateKey
        ? await renderTemplateFile(`email/${templateKey}.ejs`, {
            notif,
            content: dto,
          })
        : asString(dto?.html, "<p></p>");

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
              staff.email,
              process.env.DEVELOPER_EMAIL!,
            );
            const res = await sendZeptoMail(
              recipient,
              subject,
              html,
              asString(staff.name, "User"),
              dto.emailAttachments,
              asString(dto.emailFromName, "Academic360 Notifications"),
            );
            if (!res.ok) throw new Error(res.error);
            await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
          }
        } else {
          // Fallback to developer contact if no staff opted-in
          const res = await sendZeptoMail(
            process.env.DEVELOPER_EMAIL!,
            subject,
            html,
            "Developer",
            dto.emailAttachments,
            asString(dto.emailFromName, "Academic360 Notifications"),
          );
          if (!res.ok) throw new Error(res.error);
          await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
        }
      } else {
        // development -> dev contacts; production -> honor meta
        const devOnly = env === "development" ? true : devOnlyMeta;
        const resolvedEmail = devOnly
          ? process.env.DEVELOPER_EMAIL!
          : asString(user?.email, process.env.DEVELOPER_EMAIL!);
        const res = await sendZeptoMail(
          resolvedEmail,
          subject,
          html,
          undefined,
          dto.emailAttachments,
          asString(dto.emailFromName, "Academic360 Notifications"),
        );
        if (!res.ok) throw new Error(res.error);
        await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
      }

      await db
        .update(notificationModel)
        .set({ status: "SENT", sentAt: new Date() })
        .where(eq(notificationModel.id, row.notificationId));
      await db
        .delete(notificationQueueModel)
        .where(eq(notificationQueueModel.id, row.id));
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

export function startEmailWorker() {
  setInterval(() => {
    processBatch().catch(() => undefined);
  }, POLL_MS);
}
