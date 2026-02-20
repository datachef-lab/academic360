import { db } from "@/db";
import { enqueueNotification } from "@/services/notificationClient";
import { notificationMasterModel } from "@repo/db/schemas";
import { and, eq } from "drizzle-orm";

export async function notifyExamForm(userId: number) {
  // TODO
  const [emailMaster] = await db
    .select()
    .from(notificationMasterModel)
    .where(and(eq(notificationMasterModel.name, "exam-form-submission")));

  if (!emailMaster) {
    console.log("Return");
    return;
  }

  const otherUsersEmails: string[] = []; // TODO

  const notificationData = {
    // TODO
    userId,
    variant: "EMAIL" as const,
    type: "EXAM" as const,
    message: `Exam Form Submission Confirmation`,
    notificationMasterId: emailMaster.id,
    // Set otherUsersEmails for development/staging (not sent to real student)
    otherUsersEmails:
      otherUsersEmails.length > 0 ? otherUsersEmails : undefined,
    otherUsersWhatsAppNumbers: undefined, // Email variant doesn't need WhatsApp numbers
    // Store PDF S3 URL for email worker to download
    // emailAttachments: data.pdfUrl ? [{ pdfS3Url: data.pdfUrl }] : undefined,
    // Pass template data for conditional document display
    notificationEvent: {
      templateData: {},
    },
  };

  enqueueNotification(notificationData);
}
