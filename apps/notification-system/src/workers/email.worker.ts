// NOTE: Avoid per-iteration client creation; reuse shared db instance
import {
  notificationQueueModel,
  notificationModel,
  notificationContentModel,
} from "@repo/db/schemas/models/notifications";
import { and, eq, inArray } from "drizzle-orm";
import { sendZeptoMail } from "@/providers/zepto.js";
import type { NotificationEventDto } from "@repo/db/dtos/notifications";
import { renderTemplateFile, renderTemplateString } from "@/utils/templates.js";
import {
  notificationMasterModel,
  notificationMasterMetaModel,
  notificationMasterFieldModel,
} from "@repo/db/schemas/models/notifications";
import { db } from "@/db";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const POLL_MS = Number(process.env.EMAIL_POLL_MS ?? 3000);
const BATCH_SIZE = Number(process.env.EMAIL_BATCH_SIZE ?? 50);
const RATE_DELAY_MS = Number(process.env.EMAIL_RATE_DELAY_MS ?? 250);
const MAX_RETRIES = Number(process.env.EMAIL_MAX_RETRIES ?? 5);

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Prepare email attachments from stored paths
 */
async function prepareEmailAttachments(emailAttachments: any): Promise<
  | Array<{
      filename: string;
      contentBase64: string;
      mimeType: string;
    }>
  | undefined
> {
  if (
    !emailAttachments ||
    !Array.isArray(emailAttachments) ||
    emailAttachments.length === 0
  ) {
    return undefined;
  }

  const attachments: Array<{
    filename: string;
    contentBase64: string;
    mimeType: string;
  }> = [];

  for (const attachment of emailAttachments) {
    if (attachment.pdfS3Url) {
      try {
        console.log(
          "📎 [email.worker] Processing PDF attachment from S3:",
          attachment.pdfS3Url,
        );

        // Extract S3 key from URL
        const url = new URL(attachment.pdfS3Url);
        const key = url.pathname.substring(1); // Remove leading slash

        console.log("📎 [email.worker] Extracted S3 key:", key);

        // Initialize S3 client
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || "ap-south-1",
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });

        // Download PDF from S3 using S3 client
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME || "stage-academic360-app",
          Key: key,
        });

        const response = await s3Client.send(command);
        const pdfBuffer = await response.Body!.transformToByteArray();
        const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

        // Generate filename
        const filename = "cu-registration-form.pdf";

        console.log("📎 [email.worker] PDF attachment prepared successfully:", {
          filename,
          size: pdfBuffer.length,
          mimeType: "application/pdf",
        });

        attachments.push({
          filename,
          contentBase64: pdfBase64,
          mimeType: "application/pdf",
        });
      } catch (error) {
        console.error(
          "❌ [email.worker] Error preparing PDF attachment:",
          error,
        );
      }
    }
  }

  return attachments.length > 0 ? attachments : undefined;
}

async function processBatch() {
  const rows = await db
    .select()
    .from(notificationQueueModel)
    .where(
      and(
        eq(notificationQueueModel.type, "EMAIL_QUEUE" as never),
        eq(notificationQueueModel.isDeadLetter, false),
      ),
    )
    .limit(BATCH_SIZE);

  for (const row of rows) {
    try {
      const [notif] = await db
        .select()
        .from(notificationModel)
        .where(eq(notificationModel.id, row.notificationId))
        .limit(1);
      console.log("[email.worker] picked ->", {
        rowId: row.id,
        notifId: notif?.id,
        userId: notif?.userId,
      });
      // Fetch user to allow STAFF bypass for devOnly
      const { userModel } = await import("@repo/db/schemas/models/user");
      const [user] = await db
        .select()
        .from(userModel)
        .where(eq(userModel.id, notif.userId as number))
        .limit(1);

      // Fetch all content rows for this notification (one per field)
      const contentRows = await db
        .select()
        .from(notificationContentModel)
        .where(eq(notificationContentModel.notificationId, row.notificationId));

      console.log(
        "[email.worker] content rows:",
        JSON.stringify(contentRows, null, 2),
      );

      // Build dto from notification event data (not from content rows)
      const dto: NotificationEventDto = {
        templateData: {},
        meta: { devOnly: true },
        emailAttachments: await prepareEmailAttachments(notif.emailAttachments),
      } as NotificationEventDto;
      const env = String(process.env.NODE_ENV || "development");
      const devOnlyMeta = Boolean(dto?.meta?.devOnly);
      // Resolve template via notification master (preferred), fallback to dto.emailTemplate
      let templateKey = dto.emailTemplate;
      // Subject should be dynamic: prefer subjectTemplate, then explicit subject, then by-template defaults
      let subject: string = "Notification";
      let computedTemplateData: Record<string, string> | undefined;
      let computedTemplateList: { name: string; value: string }[] | undefined;
      if (notif.notificationMasterId) {
        const [master] = await db
          .select()
          .from(notificationMasterModel)
          .where(eq(notificationMasterModel.id, notif.notificationMasterId))
          .limit(1);
        console.log(
          "[email.worker] master check =>",
          JSON.stringify({
            id: notif.notificationMasterId,
            isActive: master?.isActive,
            template: master?.template,
          }),
        );
        // Skip sending if master is not active; dead-letter and continue once
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
              type: "DEAD_LETTER_QUEUE" as never,
              failedReason: "Notification master inactive",
              deadLetterAt: new Date(),
            })
            .where(eq(notificationQueueModel.id, row.id));
          continue;
        }
        // Compute subject after templateKey and template data resolution
        {
          const subjectFromTemplate = dto?.subjectTemplate
            ? await renderTemplateString(dto.subjectTemplate, {
                notif,
                content: dto,
              })
            : undefined;
          const defaultSubjectByTemplate: Record<string, string> = {
            otp: "Your OTP Code - The Bhawanipur Education Society College",
            subjectSelectionConfirmation:
              "Confirmation of Semester-wise Subject Selection",
          };
          subject = asString(
            subjectFromTemplate || (dto as any)?.subject,
            templateKey
              ? defaultSubjectByTemplate[String(templateKey)] || "Notification"
              : "Notification",
          );
        }
        if (master?.template)
          templateKey = master.template as unknown as string;

        // Build template data based on meta sequence and contents captured against field IDs
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
        const orderedMetas = [...metas].sort(
          (a, b) => (a.sequence || 0) - (b.sequence || 0),
        );
        const fieldIds = orderedMetas.map((m) => m.notificationMasterFieldId);
        let fieldNameById: Record<number, string> = {};
        if (fieldIds.length > 0) {
          const fields = await db
            .select()
            .from(notificationMasterFieldModel)
            .where(inArray(notificationMasterFieldModel.id, fieldIds));
          fieldNameById = Object.fromEntries(
            fields.map((f) => [f.id as number, String(f.name)]),
          );
        }
        // Fetch contents for this notification keyed by field id
        let contentByFieldId: Record<number, string> = {};
        if (fieldIds.length > 0) {
          const contents = await db
            .select()
            .from(notificationContentModel)
            .where(
              and(
                eq(notificationContentModel.notificationId, row.notificationId),
                inArray(notificationContentModel.whatsappFieldId, fieldIds),
              ),
            );
          for (const c of contents) {
            contentByFieldId[c.whatsappFieldId as number] = String(c.content);
          }
        }
        // Construct template data object in sequence order
        const orderedEntries: [string, string][] = [];
        for (const m of orderedMetas) {
          const name = fieldNameById[m.notificationMasterFieldId];
          if (!name) continue;
          const value = String(
            contentByFieldId[m.notificationMasterFieldId] ?? "",
          );
          orderedEntries.push([name, value]);
        }
        if (orderedEntries.length > 0) {
          computedTemplateData = Object.fromEntries(orderedEntries);
          computedTemplateList = orderedEntries.map(([name, value]) => ({
            name,
            value,
          }));
          console.log(
            "[email.worker] computed template data:",
            JSON.stringify(computedTemplateData, null, 2),
          );
        }
      }

      // Fallback: extract OTP from notification message if not present in template data
      if (!computedTemplateData || !(computedTemplateData as any).otpCode) {
        const otpFromMessage =
          typeof notif?.message === "string"
            ? (notif.message.match(/\b\d{4,8}\b/) || [])[0]
            : undefined;
        if (otpFromMessage) {
          computedTemplateData = {
            ...(computedTemplateData || {}),
            otpCode: otpFromMessage,
          } as Record<string, string>;
          console.log(
            "[email.worker] otp fallback from message ->",
            otpFromMessage,
          );
        }
      }

      // Transform template data into subjectsByCategory format for the email template
      let subjectsByCategory: Record<string, Record<string, string>> = {};
      if (computedTemplateData) {
        // Initialize categories
        subjectsByCategory = {
          Minor: { I: "", II: "", III: "", IV: "" },
          IDC: { I: "", II: "", III: "", IV: "" },
          AEC: { I: "", II: "", III: "", IV: "" },
          CVAC: { I: "", II: "", III: "", IV: "" },
        };

        // Map field names to categories and semesters
        for (const [fieldName, subjectName] of Object.entries(
          computedTemplateData,
        )) {
          const hasValue =
            typeof subjectName === "string" && subjectName.trim().length > 0;
          if (fieldName.includes("Minor 1")) {
            if (hasValue) {
              subjectsByCategory["Minor"]["I"] = subjectName;
              subjectsByCategory["Minor"]["II"] = subjectName;
            }
          } else if (fieldName.includes("Minor 2")) {
            // Minor 2 spans Semester III & IV
            if (hasValue) {
              subjectsByCategory["Minor"]["III"] = subjectName;
              subjectsByCategory["Minor"]["IV"] = subjectName;
            }
          } else if (fieldName.includes("Minor 3")) {
            // If Minor 3 exists in master/meta it should appear in Sem III
            if (hasValue) {
              subjectsByCategory["Minor"]["III"] = subjectName;
            }
          } else if (fieldName.includes("IDC 1")) {
            if (hasValue) subjectsByCategory["IDC"]["I"] = subjectName;
          } else if (fieldName.includes("IDC 2")) {
            if (hasValue) subjectsByCategory["IDC"]["II"] = subjectName;
          } else if (fieldName.includes("IDC 3")) {
            if (hasValue) subjectsByCategory["IDC"]["III"] = subjectName;
          } else if (fieldName.includes("AEC")) {
            // AEC is shown for Semester III and IV as per design
            if (hasValue) {
              subjectsByCategory["AEC"]["III"] = subjectName;
              subjectsByCategory["AEC"]["IV"] = subjectName;
            }
          } else if (fieldName.includes("CVAC 4")) {
            // CVAC 4 is for Semester II (naming retained from master)
            if (hasValue) subjectsByCategory["CVAC"]["II"] = subjectName;
          }
        }
      }

      const resolvedContent: NotificationEventDto & {
        templateList?: { name: string; value: string }[];
        subjectsByCategory?: Record<string, Record<string, string>>;
        academicYear?: string;
      } = {
        ...dto,
        templateData: computedTemplateData ?? dto.templateData,
        templateList: computedTemplateList,
        subjectsByCategory,
        academicYear: computedTemplateData?.["academicYear"] || "",
      };

      console.log(
        "[email.worker] transformed subjectsByCategory:",
        JSON.stringify(subjectsByCategory, null, 2),
      );
      // Debug: log subject/template/otp for visibility
      console.log(
        "[email.worker] resolved subject/template/otp ->",
        JSON.stringify(
          {
            subject,
            templateKey,
            otpCode:
              (resolvedContent as any)?.otpCode ||
              resolvedContent?.templateData?.["otpCode"],
          },
          null,
          2,
        ),
      );

      let html: string;
      if (templateKey) {
        try {
          console.log(
            `[email.worker] rendering template: email/${templateKey}.ejs`,
          );
          html = await renderTemplateFile(`email/${templateKey}.ejs`, {
            notif,
            user,
            content: resolvedContent,
          });
          console.log(`[email.worker] template rendered successfully`);
        } catch (templateErr: any) {
          console.log(
            `[email.worker] template rendering failed:`,
            templateErr.message,
          );
          throw new Error(`Template rendering failed: ${templateErr.message}`);
        }
      } else {
        html = asString(dto?.html, "<p></p>");
      }

      if (env === "staging") {
        console.log("[email.worker] sending to staging staff users");
        // Fan-out to all STAFF who opted-in and are active/not suspended
        const staffUsers = await db
          .select()
          .from(userModel)
          .where(
            and(
              eq(userModel.type, "STAFF" as never),
              eq(userModel.sendStagingNotifications, true),
              eq(userModel.isActive, true),
              eq(userModel.isSuspended, false),
            ),
          )
          .limit(500);
        if (staffUsers.length > 0) {
          for (const staff of staffUsers) {
            const recipient = asString(
              staff.email,
              process.env.DEVELOPER_EMAIL!,
            );
            console.log(`[email.worker] sending to staff: ${recipient}`);
            const res = await sendZeptoMail(
              recipient,
              subject,
              html,
              asString(staff.name, "User"),
              dto.emailAttachments,
              asString(
                dto.emailFromName,
                "BESC | The Bhawanipur Education Society College - Important Notification",
              ),
            );
            if (!res.ok) {
              console.log(
                `[email.worker] ZeptoMail failed for staff ${recipient}:`,
                res.error,
              );
              throw new Error(`ZeptoMail API Error: ${res.error}`);
            }
            await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
          }
        } else {
          // Fallback to developer contact if no staff opted-in
          console.log(
            `[email.worker] no staff opted-in, sending to developer: ${process.env.DEVELOPER_EMAIL}`,
          );
          const res = await sendZeptoMail(
            process.env.DEVELOPER_EMAIL!,
            subject,
            html,
            "Developer",
            dto.emailAttachments,
            asString(
              dto.emailFromName,
              "The Bhawanipur Education Society College - Important Notification",
            ),
          );
          if (!res.ok) {
            console.log(
              `[email.worker] ZeptoMail failed for developer fallback:`,
              res.error,
            );
            throw new Error(`ZeptoMail API Error: ${res.error}`);
          }
          await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
        }
      } else if (env === "development") {
        // development -> always send to developer
        const resolvedEmail = process.env.DEVELOPER_EMAIL!;
        console.log(`[email.worker] sending to developer: ${resolvedEmail}`);
        const res = await sendZeptoMail(
          resolvedEmail,
          subject,
          html,
          undefined,
          dto.emailAttachments,
          asString(
            dto.emailFromName,
            "The Bhawanipur Education Society College - Important Notification",
          ),
        );
        console.log(`[email.worker] sendZeptoMail response:`, res);
        if (!res.ok) {
          console.log(`[email.worker] ZeptoMail failed with error:`, res.error);
          throw new Error(`ZeptoMail API Error: ${res.error}`);
        }
        await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
      } else if (env === "staging") {
        // staging -> send to staff emails from otherUsersEmails field
        const otherEmails = notif.otherUsersEmails as string[] | null;
        if (otherEmails && otherEmails.length > 0) {
          for (const email of otherEmails) {
            console.log(`[email.worker] sending to staging staff: ${email}`);
            const res = await sendZeptoMail(
              email,
              subject,
              html,
              undefined,
              dto.emailAttachments,
              asString(
                dto.emailFromName,
                "The Bhawanipur Education Society College - Important Notification",
              ),
            );
            console.log(`[email.worker] sendZeptoMail response:`, res);
            if (!res.ok) {
              console.log(
                `[email.worker] ZeptoMail failed with error:`,
                res.error,
              );
              throw new Error(`ZeptoMail API Error: ${res.error}`);
            }
            await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
          }
        } else {
          console.log(
            `[email.worker] No staff emails found for staging, skipping notification`,
          );
        }
      } else {
        // production -> send to real user
        const resolvedEmail = asString(
          user?.email,
          process.env.DEVELOPER_EMAIL!,
        );
        console.log(
          `[email.worker] sending to production user: ${resolvedEmail}`,
        );
        const res = await sendZeptoMail(
          resolvedEmail,
          subject,
          html,
          undefined,
          dto.emailAttachments,
          asString(
            dto.emailFromName,
            "The Bhawanipur Education Society College - Important Notification",
          ),
        );
        console.log(`[email.worker] sendZeptoMail response:`, res);
        if (!res.ok) {
          console.log(`[email.worker] ZeptoMail failed with error:`, res.error);
          throw new Error(`ZeptoMail API Error: ${res.error}`);
        }
        await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
      }

      await db
        .update(notificationModel)
        .set({ status: "SENT", sentAt: new Date() })
        .where(eq(notificationModel.id, row.notificationId));
      console.log("[email.worker] sent ->", {
        notifId: row.notificationId,
        to:
          env === "development"
            ? process.env.DEVELOPER_EMAIL
            : env === "staging"
              ? ((notif.otherUsersEmails as string[]) || []).join(", ")
              : user?.email,
      });
      await db
        .update(notificationQueueModel)
        .set({
          isDeadLetter: true,
          type: "DEAD_LETTER_QUEUE" as never,
          deadLetterAt: new Date(),
        })
        .where(eq(notificationQueueModel.id, row.id));
    } catch (err: any) {
      // Reuse shared db; do not create new clients inside the loop
      const attempts = (row.retryAttempts ?? 0) + 1;

      // Extract proper error message
      let errorMessage = "Unknown error";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err && typeof err === "object") {
        errorMessage = err.message || err.toString() || JSON.stringify(err);
      }

      console.log(
        `[email.worker] error for notification ${row.notificationId}:`,
        errorMessage,
      );
      console.log(`[email.worker] full error object:`, err);

      if (attempts >= MAX_RETRIES) {
        await db
          .update(notificationModel)
          .set({
            status: "FAILED",
            failedAt: new Date(),
            failedReason: errorMessage.slice(0, 500),
          })
          .where(eq(notificationModel.id, row.notificationId));
        await db
          .update(notificationQueueModel)
          .set({
            isDeadLetter: true,
            type: "DEAD_LETTER_QUEUE" as never,
            failedReason: errorMessage.slice(0, 500),
            deadLetterAt: new Date(),
          })
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

let emailWorkerInterval: NodeJS.Timeout | null = null;
let isEmailWorkerRunning = false;

export function startEmailWorker() {
  if (isEmailWorkerRunning) {
    console.log("[email.worker] Worker already running, skipping start");
    return;
  }

  isEmailWorkerRunning = true;
  console.log(
    `[email.worker] starting with POLL_MS=${POLL_MS}, BATCH_SIZE=${BATCH_SIZE}, RATE_DELAY_MS=${RATE_DELAY_MS}, MAX_RETRIES=${MAX_RETRIES}`,
  );

  emailWorkerInterval = setInterval(() => {
    processBatch().catch(() => undefined);
  }, POLL_MS);
}

export function stopEmailWorker() {
  if (emailWorkerInterval) {
    clearInterval(emailWorkerInterval);
    emailWorkerInterval = null;
  }
  isEmailWorkerRunning = false;
  console.log("[email.worker] Worker stopped");
}
