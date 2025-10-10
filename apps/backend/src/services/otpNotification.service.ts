import { enqueueNotification } from "./notificationClient.js";
import { db } from "@/db/index.js";
import { notificationMasterModel } from "@repo/db/schemas/models/notifications";
import { eq, and } from "drizzle-orm";

export interface OtpNotificationData {
  email: string;
  phoneNumber?: string;
  otpCode: string;
  userName?: string;
  expiryMinutes?: number;
}

export interface OtpNotificationResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// Helper function to get developer contact info for dev/staging environments
const getDeveloperContact = () => {
  const devEmail = process.env.DEVELOPER_EMAIL;
  const devPhone = process.env.DEVELOPER_PHONE;

  if (!devEmail) {
    console.warn(
      "⚠️ DEVELOPER_EMAIL not set - notifications will go to original recipients",
    );
  }
  if (!devPhone) {
    console.warn(
      "⚠️ DEVELOPER_PHONE not set - WhatsApp notifications will go to original recipients",
    );
  }

  return { devEmail, devPhone };
};

// Helper function to check if we should redirect to developer
const shouldRedirectToDeveloper = () => {
  const nodeEnv = process.env.NODE_ENV;
  return nodeEnv === "development";
};

// Helper function to check if we should send to staff only in staging
const shouldSendToStaffOnly = () => {
  const nodeEnv = process.env.NODE_ENV;
  return nodeEnv === "staging";
};

// Helper function to check if user is staff with staging notification enabled
const isStaffWithStagingNotification = async (
  email: string,
): Promise<boolean> => {
  try {
    // Import user model
    const { userModel } = await import("@repo/db/schemas/models/user");

    const [user] = await db
      .select({
        userType: userModel.type,
        sendStagingNotifications: userModel.sendStagingNotifications,
        isActive: userModel.isActive,
        isSuspended: userModel.isSuspended,
      })
      .from(userModel)
      .where(eq(userModel.email, email));

    if (!user) {
      console.log(`👤 User not found for email: ${email}`);
      return false;
    }

    const isStaff = user.userType === "STAFF" || user.userType === "ADMIN";
    const hasStagingFlag = user.sendStagingNotifications === true;
    const isActive = user.isActive === true;
    const isNotSuspended = user.isSuspended === false;

    console.log(
      `👤 User ${email}: staff=${isStaff}, stagingNotification=${hasStagingFlag}, active=${isActive}, notSuspended=${isNotSuspended}`,
    );

    return isStaff && hasStagingFlag && isActive && isNotSuspended;
  } catch (error) {
    console.error("❌ Error checking staff status:", error);
    return false;
  }
};

// Helper function to send notification to dead letter queue
const sendToDeadLetterQueue = async (
  data: OtpNotificationData,
  reason: string,
) => {
  try {
    console.log(
      `💀 Sending notification to dead letter queue. Reason: ${reason}`,
    );

    // You can implement your dead letter queue logic here
    // For now, we'll just log it and return a failed result
    const deadLetterData = {
      ...data,
      reason,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    console.log(
      "💀 Dead letter queue data:",
      JSON.stringify(deadLetterData, null, 2),
    );

    // TODO: Implement actual dead letter queue storage (database, file, etc.)
    // For now, just return a failed result
    return {
      success: false,
      error: `Notification sent to dead letter queue: ${reason}`,
    };
  } catch (error) {
    console.error("❌ Error sending to dead letter queue:", error);
    return { success: false, error: "Failed to send to dead letter queue" };
  }
};

// Send OTP via email notification
export const sendOtpEmailNotification = async (
  data: OtpNotificationData,
): Promise<OtpNotificationResult> => {
  try {
    // Check environment-specific logic
    const redirectToDev = shouldRedirectToDeveloper();
    const sendToStaffOnly = shouldSendToStaffOnly();
    const { devEmail } = getDeveloperContact();

    let targetEmail = data.email;
    let logMessage = `📧 Sending OTP email notification to: ${data.email}`;
    let shouldSend = true;

    if (redirectToDev && devEmail) {
      // Development: redirect to developer
      targetEmail = devEmail;
      logMessage = `📧 [DEV MODE] Redirecting OTP email notification from ${data.email} to developer: ${devEmail}`;
    } else if (sendToStaffOnly) {
      // Staging: only send to staff with staging notification enabled
      const isStaffWithFlag = await isStaffWithStagingNotification(data.email);
      if (!isStaffWithFlag) {
        shouldSend = false;
        logMessage = `📧 [STAGING] Skipping OTP email notification to ${data.email} - not eligible (not staff, staging disabled, inactive, or suspended)`;
      } else {
        logMessage = `📧 [STAGING] Sending OTP email notification to staff: ${data.email}`;
      }
    }

    console.log(logMessage);

    // In STAGING we still enqueue; downstream notification-system workers
    // will fan-out to eligible STAFF recipients. We only dead-letter on real errors.
    // So do not early-return for ineligible student targets here.

    // Get the OTP notification master for EMAIL
    const [emailMaster] = await db
      .select()
      .from(notificationMasterModel)
      .where(
        and(
          eq(notificationMasterModel.name, "OTP"),
          eq(notificationMasterModel.variant, "EMAIL"),
        ),
      );

    if (!emailMaster) {
      throw new Error("OTP EMAIL notification master not found");
    }

    // Resolve userId from email if available
    const { userModel } = await import("@repo/db/schemas/models/user");
    const [foundUser] = await db
      .select({ id: userModel.id })
      .from(userModel)
      .where(eq(userModel.email, data.email));
    const resolvedUserId = foundUser?.id || 0;

    // Prepare notification data
    const notificationData = {
      userId: resolvedUserId,
      variant: "EMAIL" as const,
      type: "OTP" as const,
      message: `Your OTP code is: ${data.otpCode}`,
      notificationMasterId: emailMaster.id,
      notificationEvent: {
        subject: redirectToDev
          ? `[DEV MODE] OTP for ${data.email} - Academic360`
          : sendToStaffOnly
            ? `[STAGING] OTP for ${data.email} - Academic360`
            : "Your OTP Code - Academic360",
        emailTemplate: "otp",
        templateData: {
          greetingName: redirectToDev
            ? `Developer (Original: ${data.userName || data.email})`
            : sendToStaffOnly
              ? `Staff Member (${data.userName || data.email})`
              : data.userName || "User",
          otpCode: data.otpCode,
          expiryMinutes: (data.expiryMinutes || 3).toString(),
          ...(redirectToDev && {
            originalRecipient: data.email,
            originalUserName: data.userName || "User",
          }),
          ...(sendToStaffOnly && {
            environment: "staging",
            recipientType: "staff",
          }),
        },
      },
    };

    // Enqueue the notification
    const result = await enqueueNotification(notificationData);
    console.log("✅ OTP email notification enqueued successfully");
    return { success: true, result };
  } catch (error) {
    console.error("❌ Error sending OTP email notification:", error);
    return { success: false, error: (error as Error).message };
  }
};

// Send OTP via WhatsApp notification
export const sendOtpWhatsAppNotification = async (
  data: OtpNotificationData,
): Promise<OtpNotificationResult> => {
  try {
    if (!data.phoneNumber) {
      throw new Error("Phone number is required for WhatsApp notification");
    }

    // Check environment-specific logic
    const redirectToDev = shouldRedirectToDeveloper();
    const sendToStaffOnly = shouldSendToStaffOnly();
    const { devPhone } = getDeveloperContact();

    let targetPhone = data.phoneNumber;
    let logMessage = `📱 Sending OTP WhatsApp notification to: ${data.phoneNumber}`;
    let shouldSend = true;

    if (redirectToDev && devPhone) {
      // Development: redirect to developer
      targetPhone = devPhone;
      logMessage = `📱 [DEV MODE] Redirecting OTP WhatsApp notification from ${data.phoneNumber} to developer: ${devPhone}`;
    } else if (sendToStaffOnly) {
      // Staging: only send to staff with staging notification enabled
      const isStaffWithFlag = await isStaffWithStagingNotification(data.email);
      if (!isStaffWithFlag) {
        shouldSend = false;
        logMessage = `📱 [STAGING] Skipping OTP WhatsApp notification to ${data.phoneNumber} - not eligible (not staff, staging disabled, inactive, or suspended)`;
      } else {
        logMessage = `📱 [STAGING] Sending OTP WhatsApp notification to staff: ${data.phoneNumber}`;
      }
    }

    console.log(logMessage);

    // Same rationale as email: in STAGING, always enqueue; workers handle gating/fan-out.

    // Get the OTP notification master for WHATSAPP
    const [whatsappMaster] = await db
      .select()
      .from(notificationMasterModel)
      .where(
        and(
          eq(notificationMasterModel.name, "OTP"),
          eq(notificationMasterModel.variant, "WHATSAPP"),
        ),
      );

    if (!whatsappMaster) {
      throw new Error("OTP WHATSAPP notification master not found");
    }

    // Resolve userId from email if available
    const { userModel } = await import("@repo/db/schemas/models/user");
    const [foundUser] = await db
      .select({ id: userModel.id })
      .from(userModel)
      .where(eq(userModel.email, data.email));
    const resolvedUserId = foundUser?.id || 0;

    // Prepare notification data
    const notificationData = {
      userId: resolvedUserId,
      variant: "WHATSAPP" as const,
      type: "OTP" as const,
      message: `Your OTP code is: ${data.otpCode}`,
      notificationMasterId: whatsappMaster.id,
      notificationEvent: {
        templateData: {
          greetingName: redirectToDev
            ? `Developer (Original: ${data.userName || data.phoneNumber})`
            : sendToStaffOnly
              ? `Staff Member (${data.userName || data.email})`
              : data.userName || "User",
          otpCode: data.otpCode,
          expiryMinutes: (data.expiryMinutes || 3).toString(),
          ...(redirectToDev && {
            originalRecipient: data.phoneNumber,
            originalUserName: data.userName || "User",
          }),
          ...(sendToStaffOnly && {
            environment: "staging",
            recipientType: "staff",
          }),
        },
        // Explicit body values for Interakt template placeholders (expects 1 value)
        bodyValues: [String(data.otpCode)],
      },
    };

    // Enqueue the notification
    const result = await enqueueNotification(notificationData);
    console.log("✅ OTP WhatsApp notification enqueued successfully");
    return { success: true, result };
  } catch (error) {
    console.error("❌ Error sending OTP WhatsApp notification:", error);
    return { success: false, error: (error as Error).message };
  }
};

// Send OTP via both email and WhatsApp
export const sendOtpNotifications = async (data: OtpNotificationData) => {
  const results = {
    email: { success: false, error: null as string | null },
    whatsapp: { success: false, error: null as string | null },
  };

  // Send email notification
  const emailResult = await sendOtpEmailNotification(data);
  results.email = {
    success: emailResult.success,
    error: emailResult.error || null,
  };

  // Send WhatsApp notification if phone number is provided
  if (data.phoneNumber) {
    const whatsappResult = await sendOtpWhatsAppNotification(data);
    results.whatsapp = {
      success: whatsappResult.success,
      error: whatsappResult.error || null,
    };
  }

  return results;
};
