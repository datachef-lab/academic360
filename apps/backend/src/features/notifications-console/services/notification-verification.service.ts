import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { createOtp, verifyOtp } from "@/features/auth/services/otp.service.js";
import { enqueueNotification } from "@/services/notificationClient.js";
import { notificationMasterModel, userModel } from "@repo/db/schemas";

/**
 * Shared verifier-OTP gate for sensitive notification-console actions
 * (resend, event create, event trigger). Mirrors the resend flow's mechanics
 * but keyed by an arbitrary action string so multiple flows can reuse it
 * without colliding. The resend flow keeps its own copy for stability; new
 * flows (events) use this module.
 */

export class VerificationError extends Error {
  constructor(
    public code: "NO_VERIFIERS" | "INVALID_OTP" | "INVALID_SESSION",
    message: string,
  ) {
    super(message);
  }
}

export type ActionVerifier = {
  userId: number | null;
  name: string;
  type: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export const verificationMode = ():
  | "development"
  | "staging"
  | "production" => {
  const env = (process.env.NODE_ENV || "development").toLowerCase();
  return env === "production"
    ? "production"
    : env === "staging"
      ? "staging"
      : "development";
};

const developerVerifier = (): ActionVerifier => ({
  userId: null,
  name: "Developer",
  type: "DEVELOPER",
  email: process.env.DEVELOPER_EMAIL || null,
  phone: process.env.DEVELOPER_PHONE || null,
  whatsapp: process.env.DEVELOPER_PHONE || null,
});

async function findVerifiers(): Promise<ActionVerifier[]> {
  const rows = await db
    .select({
      userId: userModel.id,
      name: userModel.name,
      type: userModel.type,
      email: userModel.email,
      phone: userModel.phone,
      whatsapp: userModel.whatsappNumber,
    })
    .from(userModel)
    .where(
      and(
        // The verifier flag is for STAFF only — never route a verification OTP
        // to a non-staff account even if the flag were somehow set.
        eq(userModel.type, "STAFF" as never),
        sql`${userModel.isNotificationVerifier} = true`,
        sql`COALESCE(${userModel.isActive}, true) = true`,
        sql`COALESCE(${userModel.isSuspended}, false) = false`,
      ),
    )
    .limit(5);
  return rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    type: r.type ? String(r.type) : null,
    email: r.email,
    phone: r.phone,
    whatsapp: r.whatsapp,
  }));
}

/** Verifiers who will receive the code — shown before it's sent. */
export async function getActionVerifiers(): Promise<{
  mode: ReturnType<typeof verificationMode>;
  verifiers: ActionVerifier[];
}> {
  const mode = verificationMode();
  if (mode === "development") return { mode, verifiers: [developerVerifier()] };
  const verifiers = await findVerifiers();
  if (verifiers.length === 0)
    throw new VerificationError(
      "NO_VERIFIERS",
      "No verifier accounts configured. Mark at least one active user as a notification verifier.",
    );
  return { mode, verifiers };
}

async function findOtpMaster(variant: "EMAIL" | "WHATSAPP") {
  const [master] = await db
    .select({ id: notificationMasterModel.id })
    .from(notificationMasterModel)
    .where(
      and(
        eq(notificationMasterModel.name, "OTP"),
        eq(notificationMasterModel.variant, variant as never),
      ),
    )
    .limit(1);
  return master ?? null;
}

function buildOtpDto(opts: {
  variant: "EMAIL" | "WHATSAPP";
  masterId: number;
  userId: number;
  greetingName: string;
  otpCode: string;
  otherUsersEmails?: string[];
  otherUsersWhatsAppNumbers?: string[];
}) {
  return {
    userId: opts.userId,
    variant: opts.variant,
    type: "OTP" as const,
    message: `Your notification verification code is: ${opts.otpCode}`,
    notificationMasterId: opts.masterId,
    // Verification housekeeping — keep out of the console lists/dashboard.
    isInternal: true,
    otherUsersEmails: opts.otherUsersEmails,
    otherUsersWhatsAppNumbers: opts.otherUsersWhatsAppNumbers,
    notificationEvent: {
      subject:
        "Notification verification - The Bhawanipur Education Society College",
      emailTemplate: "otp",
      templateData: {
        greetingName: opts.greetingName,
        otpCode: opts.otpCode,
        expiryMinutes: "5",
      },
      bodyValues:
        opts.variant === "WHATSAPP"
          ? [opts.greetingName, opts.otpCode]
          : undefined,
    },
  };
}

/**
 * Send a verification OTP for `actionKey` to the environment's verifiers.
 * development → developer; staging → verifiers via explicit otherUsers lists;
 * production → per-verifier sends. Returns the verifier list for display.
 */
export async function sendActionOtp(
  actionKey: string,
  requestedByUserId: number,
) {
  const { mode, verifiers } = await getActionVerifiers();

  const otpRow = await createOtp(
    `${actionKey}:${requestedByUserId}`,
    "FOR_EMAIL",
  );
  const otpCode = otpRow.otp;

  const emailMaster = await findOtpMaster("EMAIL");
  const whatsappMaster = await findOtpMaster("WHATSAPP");

  const sends: Promise<unknown>[] = [];
  if (mode === "development") {
    if (emailMaster)
      sends.push(
        enqueueNotification(
          buildOtpDto({
            variant: "EMAIL",
            masterId: emailMaster.id,
            userId: requestedByUserId,
            greetingName: "Developer",
            otpCode,
          }) as never,
        ),
      );
    if (whatsappMaster)
      sends.push(
        enqueueNotification(
          buildOtpDto({
            variant: "WHATSAPP",
            masterId: whatsappMaster.id,
            userId: requestedByUserId,
            greetingName: "Developer",
            otpCode,
          }) as never,
        ),
      );
  } else if (mode === "staging") {
    const emails = verifiers.map((v) => v.email).filter(Boolean) as string[];
    const phones = verifiers
      .map((v) => v.whatsapp ?? v.phone)
      .filter(Boolean) as string[];
    if (emailMaster && emails.length)
      sends.push(
        enqueueNotification(
          buildOtpDto({
            variant: "EMAIL",
            masterId: emailMaster.id,
            userId: requestedByUserId,
            greetingName: "Verifier",
            otpCode,
            otherUsersEmails: emails,
          }) as never,
        ),
      );
    if (whatsappMaster && phones.length)
      sends.push(
        enqueueNotification(
          buildOtpDto({
            variant: "WHATSAPP",
            masterId: whatsappMaster.id,
            userId: requestedByUserId,
            greetingName: "Verifier",
            otpCode,
            otherUsersWhatsAppNumbers: phones,
          }) as never,
        ),
      );
  } else {
    for (const v of verifiers) {
      if (!v.userId) continue;
      if (emailMaster)
        sends.push(
          enqueueNotification(
            buildOtpDto({
              variant: "EMAIL",
              masterId: emailMaster.id,
              userId: v.userId,
              greetingName: v.name,
              otpCode,
            }) as never,
          ),
        );
      if (whatsappMaster)
        sends.push(
          enqueueNotification(
            buildOtpDto({
              variant: "WHATSAPP",
              masterId: whatsappMaster.id,
              userId: v.userId,
              greetingName: v.name,
              otpCode,
            }) as never,
          ),
        );
    }
  }
  await Promise.allSettled(sends);
  return { mode, verifiers, expiresMinutes: 5 };
}

// In-memory verified-action tokens (10 min TTL), keyed by token string.
type ActionSession = {
  actionKey: string;
  requestedByUserId: number;
  createdAt: number;
};
const SESSION_TTL_MS = 10 * 60 * 1000;
const sessions = new Map<string, ActionSession>();

function sweepSessions() {
  const now = Date.now();
  for (const [k, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL_MS) sessions.delete(k);
  }
}

/** Verify the OTP for `actionKey` → issue a short-lived token. */
export async function verifyActionOtp(
  actionKey: string,
  requestedByUserId: number,
  otpCode: string,
) {
  const result = await verifyOtp(
    `${actionKey}:${requestedByUserId}`,
    otpCode,
    "FOR_EMAIL",
  );
  if (!result.success)
    throw new VerificationError("INVALID_OTP", result.message);

  sweepSessions();
  const token = crypto.randomUUID();
  sessions.set(token, { actionKey, requestedByUserId, createdAt: Date.now() });
  return { token };
}

/**
 * Validate + consume a verified-action token. Throws INVALID_SESSION if the
 * token is missing/expired or doesn't match the action + requester.
 */
export function consumeActionToken(
  actionKey: string,
  requestedByUserId: number,
  token: string,
) {
  sweepSessions();
  const s = sessions.get(token);
  if (
    !s ||
    s.actionKey !== actionKey ||
    s.requestedByUserId !== requestedByUserId
  ) {
    throw new VerificationError(
      "INVALID_SESSION",
      "Verification is invalid or expired. Verify again.",
    );
  }
  sessions.delete(token);
}
