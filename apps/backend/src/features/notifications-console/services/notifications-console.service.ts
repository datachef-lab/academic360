import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import ejs from "ejs";
import { db } from "@/db/index.js";
import { createOtp, verifyOtp } from "@/features/auth/services/otp.service.js";
import { enqueueNotification } from "@/services/notificationClient.js";
import {
  uploadToS3,
  deleteFromS3,
  getSignedUrlForFile,
  createUploadConfig,
  FileTypeConfigs,
} from "@/services/s3.service.js";
import {
  notificationModel,
  notificationMasterModel,
  notificationMasterFieldModel,
  notificationMasterMetaModel,
  notificationContentModel,
  userModel,
  studentModel,
  promotionModel,
  programCourseModel,
  sessionModel,
  academicYearModel,
  classModel,
  shiftModel,
  streamModel,
  courseModel,
  affiliationModel,
  regulationTypeModel,
} from "@repo/db/schemas";

/**
 * Read-only endpoints backing the main-console Notifications module
 * (Home / Automated Notifications / Masters pages). Queries the shared
 * notification tables directly — the notification-system worker service
 * and its /internal proxy are intentionally untouched.
 */

export type NotificationListFilters = {
  page: number;
  limit: number;
  status?: string | null;
  variant?: string | null;
  masterId?: number | null;
  search?: string | null;
};

/** Housekeeping sends (resend-verification OTPs etc.) never show in the console. */
const notInternal = (): SQL =>
  sql`COALESCE(${notificationModel.isInternal}, false) = false`;

function buildWhere(f: NotificationListFilters): SQL | undefined {
  const parts: SQL[] = [notInternal()];
  if (f.status) parts.push(eq(notificationModel.status, f.status as never));
  if (f.variant) parts.push(eq(notificationModel.variant, f.variant as never));
  if (f.masterId)
    parts.push(eq(notificationModel.notificationMasterId, f.masterId));
  if (f.search?.trim()) {
    const q = `%${f.search.trim()}%`;
    parts.push(or(ilike(userModel.name, q), ilike(userModel.email, q))!);
  }
  return parts.length ? and(...parts) : undefined;
}

const notificationRow = {
  id: notificationModel.id,
  variant: notificationModel.variant,
  type: notificationModel.type,
  status: notificationModel.status,
  sentAt: notificationModel.sentAt,
  failedAt: notificationModel.failedAt,
  failedReason: notificationModel.failedReason,
  createdAt: notificationModel.createdAt,
  masterId: notificationModel.notificationMasterId,
  masterName: notificationMasterModel.name,
  masterTemplate: notificationMasterModel.template,
  userId: notificationModel.userId,
  userName: userModel.name,
  userEmail: userModel.email,
  userPhone: userModel.phone,
  userWhatsapp: userModel.whatsappNumber,
  studentUid: studentModel.uid,
};

export async function listNotifications(f: NotificationListFilters) {
  const where = buildWhere(f);
  const offset = (f.page - 1) * f.limit;

  const [{ total }] = await db
    .select({ total: count() })
    .from(notificationModel)
    .leftJoin(
      notificationMasterModel,
      eq(notificationMasterModel.id, notificationModel.notificationMasterId),
    )
    .leftJoin(userModel, eq(userModel.id, notificationModel.userId))
    .where(where);

  const rows = await db
    .select(notificationRow)
    .from(notificationModel)
    .leftJoin(
      notificationMasterModel,
      eq(notificationMasterModel.id, notificationModel.notificationMasterId),
    )
    .leftJoin(userModel, eq(userModel.id, notificationModel.userId))
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .where(where)
    .orderBy(desc(notificationModel.createdAt), desc(notificationModel.id))
    .limit(f.limit)
    .offset(offset);

  return { rows, total: Number(total), page: f.page, limit: f.limit };
}

const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const humanizeKey = (k: string) =>
  k
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
const asDisplayValue = (v: unknown): string =>
  v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);

/**
 * Field label + captured value rows for one notification (dialog view).
 *
 * The enqueue pipeline fills `notification_contents` from
 * `templateData[<field name>]`, but for most EMAIL masters the field names
 * ("Name", "Code") don't match the templateData keys ("greetingName",
 * "otpCode") — so the stored values are empty, and some masters have no
 * content rows at all. The real payload lives in the notification's `message`
 * JSON (`notificationEvent.templateData`, or `bodyValues` for field-less
 * WhatsApp sends). This resolves values from there when the stored ones are
 * empty, and appends any remaining templateData entries so nothing is hidden.
 */
export async function getNotificationContents(notificationId: number) {
  const rows = await db
    .select({
      field: notificationMasterFieldModel.name,
      value: notificationContentModel.content,
    })
    .from(notificationContentModel)
    .leftJoin(
      notificationMasterFieldModel,
      eq(
        notificationMasterFieldModel.id,
        notificationContentModel.whatsappFieldId,
      ),
    )
    .where(eq(notificationContentModel.notificationId, notificationId))
    .orderBy(notificationContentModel.id);

  const [notif] = await db
    .select({ message: notificationModel.message })
    .from(notificationModel)
    .where(eq(notificationModel.id, notificationId))
    .limit(1);

  let templateData: Record<string, unknown> = {};
  let bodyValues: unknown[] = [];
  try {
    const parsed = JSON.parse(notif?.message ?? "");
    const td = parsed?.notificationEvent?.templateData;
    if (td && typeof td === "object" && !Array.isArray(td)) templateData = td;
    if (Array.isArray(parsed?.bodyValues)) bodyValues = parsed.bodyValues;
  } catch {
    // plain-text message — nothing to mine
  }

  const tdEntries = Object.entries(templateData);
  const used = new Set<string>();

  // Pass 1: rows that already hold a value claim their matching templateData
  // key, so it isn't re-appended as a duplicate below.
  for (const r of rows) {
    if (!r.value?.trim()) continue;
    const fn = normKey(r.field ?? "");
    const hit = tdEntries.find(
      ([k]) =>
        !used.has(k) &&
        fn &&
        (normKey(k).includes(fn) || fn.includes(normKey(k))),
    );
    if (hit) used.add(hit[0]);
  }

  // Pass 2: fill empty row values from templateData by fuzzy key match
  // ("Name" ↔ greetingName/studentName, "Code" ↔ otpCode, ...).
  const result = rows.map((r) => {
    if (r.value?.trim()) return { field: r.field, value: r.value };
    const fn = normKey(r.field ?? "");
    const hit = tdEntries.find(
      ([k]) =>
        !used.has(k) &&
        fn &&
        (normKey(k).includes(fn) || fn.includes(normKey(k))),
    );
    if (hit) {
      used.add(hit[0]);
      return { field: r.field, value: asDisplayValue(hit[1]) };
    }
    return { field: r.field, value: r.value };
  });

  // Pass 3: everything else in templateData becomes an extra row.
  for (const [k, v] of tdEntries) {
    if (used.has(k)) continue;
    result.push({ field: humanizeKey(k), value: asDisplayValue(v) });
  }

  // Field-less WhatsApp sends: raw ordered body values.
  if (result.length === 0 && bodyValues.length > 0) {
    bodyValues.forEach((v, i) =>
      result.push({ field: `Value ${i + 1}`, value: asDisplayValue(v) }),
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Resend flow (OTP-verified)
// ---------------------------------------------------------------------------

type ResendSession = {
  token: string;
  notificationId: number;
  requestedByUserId: number;
  createdAt: number;
};

const RESEND_SESSION_TTL_MS = 10 * 60 * 1000;
const resendSessions = new Map<string, ResendSession>();

function sweepResendSessions() {
  const now = Date.now();
  for (const [k, s] of resendSessions) {
    if (now - s.createdAt > RESEND_SESSION_TTL_MS) resendSessions.delete(k);
  }
}

const resendMode = (): "development" | "staging" | "production" => {
  const env = (process.env.NODE_ENV || "development").toLowerCase();
  return env === "production"
    ? "production"
    : env === "staging"
      ? "staging"
      : "development";
};

const otpRecipientKey = (notificationId: number, userId: number) =>
  `resend:${notificationId}:${userId}`;

export type ResendVerifier = {
  userId: number | null;
  name: string;
  type: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

const developerVerifier = (): ResendVerifier => ({
  userId: null,
  name: "Developer",
  type: "DEVELOPER",
  email: process.env.DEVELOPER_EMAIL || null,
  phone: process.env.DEVELOPER_PHONE || null,
  whatsapp: process.env.DEVELOPER_PHONE || null,
});

async function findVerifiers(): Promise<ResendVerifier[]> {
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
        sql`${userModel.isNotificationVerifier} = true`,
        sql`COALESCE(${userModel.isActive}, true) = true`,
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

/** Who would receive the verification OTP — shown before the code is sent. */
export async function getResendVerifiers(notificationId: number) {
  const [notif] = await db
    .select({ id: notificationModel.id })
    .from(notificationModel)
    .where(eq(notificationModel.id, notificationId))
    .limit(1);
  if (!notif) throw new ResendError("NOT_FOUND", "Notification not found.");

  const mode = resendMode();
  if (mode === "development") return { mode, verifiers: [developerVerifier()] };
  // Return the real mode even when no verifier is configured — don't throw
  // here, or the dialog can't learn the environment and falls back to showing
  // "development". The empty list drives a "configure a verifier" note in the
  // UI; the actual send step (startResendOtp) still enforces NO_VERIFIERS.
  const verifiers = await findVerifiers();
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
    message: `Your notification-resend verification code is: ${opts.otpCode}`,
    notificationMasterId: opts.masterId,
    // Verification housekeeping — keep out of the console lists/dashboard.
    isInternal: true,
    otherUsersEmails: opts.otherUsersEmails,
    otherUsersWhatsAppNumbers: opts.otherUsersWhatsAppNumbers,
    notificationEvent: {
      subject:
        "Notification resend verification - The Bhawanipur Education Society College",
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

export class ResendError extends Error {
  constructor(
    public code:
      | "NOT_FOUND"
      | "NO_VERIFIERS"
      | "INVALID_OTP"
      | "INVALID_SESSION",
    message: string,
  ) {
    super(message);
  }
}

/** Step 1: generate the OTP and deliver it per environment. */
export async function startResendOtp(
  notificationId: number,
  requestedByUserId: number,
) {
  const [notif] = await db
    .select({ id: notificationModel.id })
    .from(notificationModel)
    .where(eq(notificationModel.id, notificationId))
    .limit(1);
  if (!notif) throw new ResendError("NOT_FOUND", "Notification not found.");

  const mode = resendMode();

  let verifiers: ResendVerifier[];
  if (mode === "development") {
    verifiers = [developerVerifier()];
  } else {
    verifiers = await findVerifiers();
    if (verifiers.length === 0)
      throw new ResendError(
        "NO_VERIFIERS",
        "No verifier accounts configured. Mark at least one active user as a notification verifier.",
      );
  }

  const otpRow = await createOtp(
    otpRecipientKey(notificationId, requestedByUserId),
    "FOR_EMAIL",
  );
  const otpCode = otpRow.otp;

  const emailMaster = await findOtpMaster("EMAIL");
  const whatsappMaster = await findOtpMaster("WHATSAPP");

  // Delivery per environment. The notification-system worker env routing:
  // development → developer inbox/phone regardless of target;
  // staging → explicit otherUsers* lists (worker change) → exactly the verifiers;
  // production → the dto's user.
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

/** Step 2: verify the OTP → session token + env-scoped recipients. */
export async function verifyResendOtp(
  notificationId: number,
  requestedByUserId: number,
  otpCode: string,
) {
  const result = await verifyOtp(
    otpRecipientKey(notificationId, requestedByUserId),
    otpCode,
    "FOR_EMAIL",
  );
  if (!result.success) throw new ResendError("INVALID_OTP", result.message);

  const mode = resendMode();
  let recipients: Array<
    ResendVerifier & {
      studentUid?: string | null;
      selectable: boolean;
    }
  > = [];

  if (mode === "development") {
    recipients = [{ ...developerVerifier(), selectable: false }];
  } else if (mode === "staging") {
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
          sql`${userModel.sendStagingNotifications} = true`,
          sql`COALESCE(${userModel.isActive}, true) = true`,
        ),
      );
    recipients = rows.map((r) => ({
      userId: r.userId,
      name: r.name,
      type: r.type ? String(r.type) : null,
      email: r.email,
      phone: r.phone,
      whatsapp: r.whatsapp,
      selectable: true,
    }));
  } else {
    const [row] = await db
      .select({
        userId: userModel.id,
        name: userModel.name,
        type: userModel.type,
        email: userModel.email,
        phone: userModel.phone,
        whatsapp: userModel.whatsappNumber,
        studentUid: studentModel.uid,
      })
      .from(notificationModel)
      .leftJoin(userModel, eq(userModel.id, notificationModel.userId))
      .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
      .where(eq(notificationModel.id, notificationId))
      .limit(1);
    recipients = row?.userId
      ? [
          {
            userId: row.userId,
            name: row.name ?? "Recipient",
            type: row.type ? String(row.type) : null,
            email: row.email,
            phone: row.phone,
            whatsapp: row.whatsapp,
            studentUid: row.studentUid,
            selectable: false,
          },
        ]
      : [];
  }

  sweepResendSessions();
  const token = crypto.randomUUID();
  resendSessions.set(token, {
    token,
    notificationId,
    requestedByUserId,
    createdAt: Date.now(),
  });

  return { token, mode, recipients };
}

/** Step 3: re-enqueue the notification to the confirmed recipients. */
export async function confirmResend(
  notificationId: number,
  requestedByUserId: number,
  token: string,
  selectedUserIds?: number[],
) {
  sweepResendSessions();
  const session = resendSessions.get(token);
  if (
    !session ||
    session.notificationId !== notificationId ||
    session.requestedByUserId !== requestedByUserId
  ) {
    throw new ResendError(
      "INVALID_SESSION",
      "Resend session is invalid or expired. Verify again.",
    );
  }

  const [notif] = await db
    .select()
    .from(notificationModel)
    .where(eq(notificationModel.id, notificationId))
    .limit(1);
  if (!notif) throw new ResendError("NOT_FOUND", "Notification not found.");

  // Reconstruct the original payload from the stored message JSON + contents.
  let originalMessage = notif.message ?? "";
  let templateData: Record<string, unknown> | undefined;
  let subject: string | undefined;
  let bodyValues: string[] | undefined;
  try {
    const parsed = JSON.parse(notif.message ?? "");
    if (typeof parsed?.originalMessage === "string")
      originalMessage = parsed.originalMessage;
    const td = parsed?.notificationEvent?.templateData;
    if (td && typeof td === "object" && !Array.isArray(td)) {
      templateData = td;
      if (typeof td.subject === "string") subject = td.subject;
    }
    if (!subject && typeof parsed?.notificationEvent?.subject === "string")
      subject = parsed.notificationEvent.subject;
    if (Array.isArray(parsed?.bodyValues))
      bodyValues = parsed.bodyValues.map(String);
  } catch {
    // plain-text message
  }

  if (
    notif.variant === "WHATSAPP" &&
    (!bodyValues || bodyValues.length === 0)
  ) {
    const contents = await db
      .select({ content: notificationContentModel.content })
      .from(notificationContentModel)
      .where(eq(notificationContentModel.notificationId, notificationId))
      .orderBy(notificationContentModel.id);
    if (contents.length)
      bodyValues = contents.map((c) => String(c.content ?? ""));
  }

  const mode = resendMode();
  let otherUsersEmails: string[] | undefined;
  let otherUsersWhatsAppNumbers: string[] | undefined;
  if (mode === "staging" && selectedUserIds?.length) {
    // Never trust the client's ids alone: only staging-notification staff are
    // eligible, otherwise a stray id would route to a real user's contact.
    const rows = await db
      .select({
        email: userModel.email,
        phone: userModel.phone,
        whatsapp: userModel.whatsappNumber,
      })
      .from(userModel)
      .where(
        and(
          inArray(userModel.id, selectedUserIds),
          sql`${userModel.sendStagingNotifications} = true`,
          sql`COALESCE(${userModel.isActive}, true) = true`,
        ),
      );
    if (rows.length === 0)
      throw new ResendError(
        "INVALID_SESSION",
        "None of the selected recipients are eligible staging-notification staff.",
      );
    otherUsersEmails = rows.map((r) => r.email).filter(Boolean) as string[];
    otherUsersWhatsAppNumbers = rows
      .map((r) => r.phone ?? r.whatsapp)
      .filter(Boolean) as string[];
  }

  const dto = {
    userId: notif.userId,
    applicationFormId: notif.applicationFormId,
    notificationMasterId: notif.notificationMasterId,
    variant: notif.variant,
    type: notif.type,
    message: originalMessage,
    otherUsersEmails,
    otherUsersWhatsAppNumbers,
    notificationEvent:
      templateData || subject || bodyValues
        ? { subject, templateData, bodyValues }
        : undefined,
  };

  const result = (await enqueueNotification(dto as never)) as {
    ok?: boolean;
    id?: number;
  };
  resendSessions.delete(token);
  if (!result?.id) throw new Error("Failed to enqueue the resend.");
  return { newNotificationId: result.id };
}

/** Step 4: delivery status of the re-enqueued notification (polled by the UI). */
export async function getResendStatus(newNotificationId: number) {
  const [row] = await db
    .select({
      id: notificationModel.id,
      status: notificationModel.status,
      sentAt: notificationModel.sentAt,
      failedAt: notificationModel.failedAt,
      failedReason: notificationModel.failedReason,
    })
    .from(notificationModel)
    .where(eq(notificationModel.id, newNotificationId))
    .limit(1);
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Email preview (renders the real notification-system EJS template)
// ---------------------------------------------------------------------------

/**
 * The EJS templates belong to the notification-system app, which lives in the
 * same monorepo checkout — resolve its templates dir relative to the backend.
 */
function resolveTemplatesDir(): string | null {
  const candidates = [
    process.env.NOTIFICATION_TEMPLATES_DIR,
    path.resolve(process.cwd(), "../notification-system/src/templates"),
    path.resolve(process.cwd(), "../../apps/notification-system/src/templates"),
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir)) return dir;
    } catch {
      // keep looking
    }
  }
  return null;
}

/** Mirrors email.worker.ts's subjectsByCategory mapping (subject-selection templates). */
function buildSubjectsByCategory(entries: { name: string; value: string }[]) {
  const cat: Record<string, Record<string, string>> = {
    Minor: { I: "", II: "", III: "", IV: "" },
    IDC: { I: "", II: "", III: "", IV: "" },
    AEC: { I: "", II: "", III: "", IV: "" },
    CVAC: { I: "", II: "", III: "", IV: "" },
  };
  for (const { name, value } of entries) {
    if (!value?.trim()) continue;
    if (name.includes("Minor 1")) {
      cat.Minor.I = value;
      cat.Minor.II = value;
    } else if (name.includes("Minor 2")) {
      cat.Minor.III = value;
      cat.Minor.IV = value;
    } else if (name.includes("Minor 3")) {
      cat.Minor.III = value;
    } else if (name.includes("IDC 1")) cat.IDC.I = value;
    else if (name.includes("IDC 2")) cat.IDC.II = value;
    else if (name.includes("IDC 3")) cat.IDC.III = value;
    else if (name.includes("AEC")) {
      cat.AEC.III = value;
      cat.AEC.IV = value;
    } else if (name.includes("CVAC 4")) cat.CVAC.II = value;
  }
  return cat;
}

function fallbackPreviewHtml(
  subject: string,
  rows: { field: string | null; value: string }[],
) {
  const items = rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 10px;border:1px solid #ddd;font-weight:600">${r.field ?? ""}</td><td style="padding:6px 10px;border:1px solid #ddd">${r.value || "—"}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:Arial,sans-serif;padding:16px"><h3 style="margin:0 0 12px">${subject}</h3><table style="border-collapse:collapse;font-size:13px">${items}</table></div>`;
}

/** Rendered-email preview for the console dialog (EMAIL variant). */
export async function getNotificationPreview(notificationId: number) {
  const [notif] = await db
    .select({
      id: notificationModel.id,
      variant: notificationModel.variant,
      message: notificationModel.message,
      userId: notificationModel.userId,
      masterId: notificationModel.notificationMasterId,
      masterTemplate: notificationMasterModel.template,
      masterName: notificationMasterModel.name,
    })
    .from(notificationModel)
    .leftJoin(
      notificationMasterModel,
      eq(notificationMasterModel.id, notificationModel.notificationMasterId),
    )
    .where(eq(notificationModel.id, notificationId))
    .limit(1);
  if (!notif) return null;

  const rows = await getNotificationContents(notificationId);

  let subject = notif.masterName ?? "Notification";
  let templateData: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(notif.message ?? "");
    const td = parsed?.notificationEvent?.templateData;
    if (td && typeof td === "object" && !Array.isArray(td)) templateData = td;
    if (typeof td?.subject === "string") subject = td.subject;
    else if (typeof parsed?.notificationEvent?.subject === "string")
      subject = parsed.notificationEvent.subject;
  } catch {
    // plain-text message
  }

  let user: Record<string, unknown> | null = null;
  if (notif.userId) {
    const [u] = await db
      .select({ name: userModel.name, email: userModel.email })
      .from(userModel)
      .where(eq(userModel.id, notif.userId))
      .limit(1);
    user = u ?? null;
  }

  const templateKey = notif.masterTemplate;
  const templatesDir = resolveTemplatesDir();
  const templateList = rows.map((r) => ({
    name: r.field ?? "",
    value: r.value,
  }));

  if (templateKey && templatesDir) {
    const file = path.join(templatesDir, "email", `${templateKey}.ejs`);
    if (fs.existsSync(file)) {
      // Same context shape the email worker passes to renderTemplateFile.
      const content = {
        ...templateData,
        templateData,
        dtoTemplateData: templateData,
        templateList,
        subjectsByCategory: buildSubjectsByCategory(templateList),
        academicYear: String(templateData["academicYear"] ?? ""),
        subject,
      };
      try {
        const html = await ejs.renderFile(
          file,
          { notif, user, content },
          { async: true },
        );
        return { subject, html, templateKey, rendered: true };
      } catch {
        // fall through to the generic preview
      }
    }
  }

  return {
    subject,
    html: fallbackPreviewHtml(subject, rows),
    templateKey: templateKey ?? null,
    rendered: false,
  };
}

export async function listMasters() {
  const masters = await db
    .select({
      id: notificationMasterModel.id,
      name: notificationMasterModel.name,
      variant: notificationMasterModel.variant,
      template: notificationMasterModel.template,
      previewImage: notificationMasterModel.previewImage,
      isActive: notificationMasterModel.isActive,
      isSystemTriggered: notificationMasterModel.isSystemTriggered,
      createdAt: notificationMasterModel.createdAt,
      fieldsCount: sql<number>`(
        SELECT count(*) FROM ${notificationMasterFieldModel}
        WHERE ${notificationMasterFieldModel.notificationMasterId} = ${notificationMasterModel.id}
      )`.mapWith(Number),
    })
    .from(notificationMasterModel)
    .orderBy(notificationMasterModel.name);

  // Attachments aren't a master-level setting — they're added per notification
  // by the sending code. Derive "this master sends attachments" from whether
  // any of its notifications actually carried a non-empty attachments payload.
  const attach = await db
    .select({
      masterId: notificationModel.notificationMasterId,
      withAttachments: sql<number>`count(*) filter (
        where ${notificationModel.emailAttachments} is not null
          and ${notificationModel.emailAttachments}::text not in ('null', '[]')
      )`.mapWith(Number),
    })
    .from(notificationModel)
    .where(sql`${notificationModel.notificationMasterId} is not null`)
    .groupBy(notificationModel.notificationMasterId);
  const hasAttachments = new Set(
    attach.filter((a) => a.withAttachments > 0).map((a) => a.masterId),
  );

  return masters.map((m) => ({
    ...m,
    hasAttachments: hasAttachments.has(m.id),
  }));
}

/**
 * Master-level template preview. WhatsApp masters carry an S3 preview image;
 * email masters render their EJS template with `{{field}}` placeholders.
 */
export async function getMasterPreview(masterId: number) {
  const [master] = await db
    .select()
    .from(notificationMasterModel)
    .where(eq(notificationMasterModel.id, masterId))
    .limit(1);
  if (!master) return null;

  if (master.previewImage) {
    const stored = String(master.previewImage);
    const url = stored.startsWith("http")
      ? stored
      : await getSignedUrlForFile(stored, 3600);
    return { kind: "IMAGE" as const, url, templateKey: master.template };
  }

  if (master.variant === "EMAIL" && master.template) {
    const templatesDir = resolveTemplatesDir();
    const file = templatesDir
      ? path.join(templatesDir, "email", `${master.template}.ejs`)
      : null;
    if (file && fs.existsSync(file)) {
      const fields = await listMasterFields(masterId);
      const sample: Record<string, unknown> = {};
      for (const f of fields) sample[f.name] = `{{${f.name}}}`;
      const templateList = fields.map((f) => ({
        name: f.name,
        value: `{{${f.name}}}`,
      }));
      const content = {
        ...sample,
        templateData: sample,
        dtoTemplateData: sample,
        templateList,
        subjectsByCategory: buildSubjectsByCategory(templateList),
        academicYear: "",
        subject: master.name,
      };
      try {
        const html = await ejs.renderFile(
          file,
          {
            notif: { variant: master.variant },
            user: { name: "Sample Student", email: "student@example.com" },
            content,
          },
          { async: true },
        );
        return { kind: "EMAIL" as const, html, templateKey: master.template };
      } catch {
        // template needs real data — no static preview possible
      }
    }
  }

  return { kind: "NONE" as const, templateKey: master.template };
}

/** Console-created masters are manual (not wired to backend code). */
export async function createMaster(input: {
  name: string;
  variant: string;
  template?: string | null;
  isActive?: boolean;
  fields?: string[];
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Master name cannot be empty.");
  const [row] = await db
    .insert(notificationMasterModel)
    .values({
      name,
      variant: input.variant as never,
      template: input.template?.trim() || null,
      isActive: input.isActive ?? true,
      isSystemTriggered: false,
    })
    .returning();
  const fields = (input.fields ?? []).map((f) => f.trim()).filter(Boolean);
  if (fields.length) {
    const inserted = await db
      .insert(notificationMasterFieldModel)
      .values(fields.map((f) => ({ notificationMasterId: row.id, name: f })))
      .returning({ id: notificationMasterFieldModel.id });
    await db.insert(notificationMasterMetaModel).values(
      inserted.map((f, i) => ({
        notificationMasterId: row.id,
        notificationMasterFieldId: f.id,
        sequence: i + 1,
        flag: true,
      })),
    );
  }
  return row;
}

/** Upload a WhatsApp preview image to S3 and store its key on the master. */
export async function setMasterPreviewImage(
  masterId: number,
  file: Express.Multer.File,
) {
  const [master] = await db
    .select({
      id: notificationMasterModel.id,
      previewImage: notificationMasterModel.previewImage,
    })
    .from(notificationMasterModel)
    .where(eq(notificationMasterModel.id, masterId))
    .limit(1);
  if (!master) return null;

  const uploaded = await uploadToS3(
    file,
    createUploadConfig("notification-masters/previews", {
      allowedMimeTypes: FileTypeConfigs.IMAGES,
      maxFileSizeMB: 5,
    }),
  );

  // Best-effort cleanup of the previous image (keys only; legacy URLs stay).
  if (master.previewImage && !String(master.previewImage).startsWith("http")) {
    try {
      await deleteFromS3(String(master.previewImage));
    } catch {
      // ignore
    }
  }

  const [row] = await db
    .update(notificationMasterModel)
    .set({ previewImage: uploaded.key })
    .where(eq(notificationMasterModel.id, masterId))
    .returning();
  return row ?? null;
}

/**
 * Placeholder names referenced by an EJS email template. Only looks inside
 * `<% ... %>` code blocks, at the shapes our templates actually use:
 * `content.<key>`, `content.(dto)templateData.<key>`, and the local `c.<key>`
 * alias some templates assign from dtoTemplateData.
 */
function extractEjsFieldNames(src: string): string[] {
  const IGNORE = new Set([
    "dtoTemplateData",
    "templateData",
    "templateList",
    "subjectsByCategory",
    "length",
  ]);
  const names: string[] = [];
  const push = (n: string | undefined) => {
    if (n && !IGNORE.has(n) && !names.includes(n)) names.push(n);
  };
  for (const block of src.matchAll(/<%[-=_#]?([\s\S]*?)[-_]?%>/g)) {
    const code = block[1] ?? "";
    for (const m of code.matchAll(
      /content\.(?:dtoTemplateData|templateData)\.([A-Za-z_][A-Za-z0-9_]*)/g,
    ))
      push(m[1]);
    for (const m of code.matchAll(
      /(?<![A-Za-z0-9_.])c\.([A-Za-z_][A-Za-z0-9_]*)/g,
    ))
      push(m[1]);
    for (const m of code.matchAll(/content\.([A-Za-z_][A-Za-z0-9_]*)/g))
      push(m[1]);
  }
  return names.slice(0, 50);
}

export type MasterFieldRow = {
  id: number;
  name: string;
  metaId: number | null;
  sequence: number | null;
  flag: boolean | null;
  /** "db" = real field rows; "template" = derived from the EJS source. */
  source: "db" | "template";
};

/**
 * Fields with their meta (canonical WhatsApp body-value sequence + enabled
 * flag), ordered by sequence. Masters without field rows (several email
 * masters) fall back to the placeholders referenced by their EJS template.
 */
export async function listMasterFields(
  masterId: number,
): Promise<MasterFieldRow[]> {
  const rows = await db
    .select({
      id: notificationMasterFieldModel.id,
      name: notificationMasterFieldModel.name,
      metaId: notificationMasterMetaModel.id,
      sequence: notificationMasterMetaModel.sequence,
      flag: notificationMasterMetaModel.flag,
    })
    .from(notificationMasterFieldModel)
    .leftJoin(
      notificationMasterMetaModel,
      and(
        eq(
          notificationMasterMetaModel.notificationMasterFieldId,
          notificationMasterFieldModel.id,
        ),
        eq(notificationMasterMetaModel.notificationMasterId, masterId),
      ),
    )
    .where(eq(notificationMasterFieldModel.notificationMasterId, masterId))
    .orderBy(notificationMasterFieldModel.id);
  if (rows.length > 0) {
    return rows
      .sort(
        (a, b) =>
          (a.sequence ?? Number.MAX_SAFE_INTEGER) -
          (b.sequence ?? Number.MAX_SAFE_INTEGER),
      )
      .map((r) => ({ ...r, source: "db" as const }));
  }

  const [master] = await db
    .select({
      variant: notificationMasterModel.variant,
      template: notificationMasterModel.template,
    })
    .from(notificationMasterModel)
    .where(eq(notificationMasterModel.id, masterId))
    .limit(1);
  if (master?.variant === "EMAIL" && master.template) {
    const templatesDir = resolveTemplatesDir();
    const file = templatesDir
      ? path.join(templatesDir, "email", `${master.template}.ejs`)
      : null;
    if (file && fs.existsSync(file)) {
      try {
        const src = fs.readFileSync(file, "utf8");
        return extractEjsFieldNames(src).map((name, i) => ({
          id: -(i + 1),
          name,
          metaId: null,
          sequence: null,
          flag: null,
          source: "template" as const,
        }));
      } catch {
        // unreadable template — treat as no fields
      }
    }
  }
  return [];
}

/** Upsert per-field meta (sequence + flag) for a master. */
async function upsertMasterMeta(
  masterId: number,
  entries: Array<{ fieldId: number; sequence: number; flag: boolean }>,
) {
  for (const e of entries) {
    const [existing] = await db
      .select({ id: notificationMasterMetaModel.id })
      .from(notificationMasterMetaModel)
      .where(
        and(
          eq(notificationMasterMetaModel.notificationMasterId, masterId),
          eq(notificationMasterMetaModel.notificationMasterFieldId, e.fieldId),
        ),
      )
      .limit(1);
    if (existing) {
      await db
        .update(notificationMasterMetaModel)
        .set({ sequence: e.sequence, flag: e.flag })
        .where(eq(notificationMasterMetaModel.id, existing.id));
    } else {
      await db.insert(notificationMasterMetaModel).values({
        notificationMasterId: masterId,
        notificationMasterFieldId: e.fieldId,
        sequence: e.sequence,
        flag: e.flag,
      });
    }
  }
}

export async function updateMaster(
  id: number,
  patch: {
    name?: string;
    template?: string | null;
    isActive?: boolean;
    newFields?: string[];
    meta?: Array<{ fieldId: number; sequence: number; flag: boolean }>;
  },
) {
  const [existing] = await db
    .select({ isSystemTriggered: notificationMasterModel.isSystemTriggered })
    .from(notificationMasterModel)
    .where(eq(notificationMasterModel.id, id))
    .limit(1);
  if (!existing) return null;

  // System-triggered masters are wired to backend code — only their active
  // status may change from the console. Everything else (name, channel,
  // template key, fields, sequence) is locked.
  const locked = existing.isSystemTriggered;

  const values: Record<string, unknown> = {};
  if (!locked && patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new Error("Master name cannot be empty.");
    values.name = name;
  }
  if (!locked && patch.template !== undefined)
    values.template = patch.template?.trim() || null;
  if (patch.isActive !== undefined) values.isActive = patch.isActive;

  const newFields = locked
    ? []
    : (patch.newFields ?? []).map((f) => f.trim()).filter(Boolean);
  const metaEntries = locked ? [] : (patch.meta ?? []);

  if (
    Object.keys(values).length === 0 &&
    newFields.length === 0 &&
    metaEntries.length === 0
  )
    return null;

  if (metaEntries.length) {
    // Only fields that actually belong to this master.
    const own = await db
      .select({ id: notificationMasterFieldModel.id })
      .from(notificationMasterFieldModel)
      .where(eq(notificationMasterFieldModel.notificationMasterId, id));
    const ownIds = new Set(own.map((f) => f.id));
    await upsertMasterMeta(
      id,
      metaEntries.filter((e) => ownIds.has(e.fieldId)),
    );
  }

  if (newFields.length) {
    const inserted = await db
      .insert(notificationMasterFieldModel)
      .values(newFields.map((name) => ({ notificationMasterId: id, name })))
      .returning({ id: notificationMasterFieldModel.id });
    // Continue the sequence after the current maximum.
    const [{ max }] = await db
      .select({
        max: sql<number>`COALESCE(MAX(${notificationMasterMetaModel.sequence}), 0)`,
      })
      .from(notificationMasterMetaModel)
      .where(eq(notificationMasterMetaModel.notificationMasterId, id));
    await db.insert(notificationMasterMetaModel).values(
      inserted.map((f, i) => ({
        notificationMasterId: id,
        notificationMasterFieldId: f.id,
        sequence: Number(max) + i + 1,
        flag: true,
      })),
    );
  }

  if (Object.keys(values).length === 0) {
    const [row] = await db
      .select()
      .from(notificationMasterModel)
      .where(eq(notificationMasterModel.id, id))
      .limit(1);
    return row ?? null;
  }

  const [row] = await db
    .update(notificationMasterModel)
    .set(values)
    .where(eq(notificationMasterModel.id, id))
    .returning();
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type DashboardFilters = {
  academicYearIds?: number[];
  variants?: string[];
  statuses?: string[];
  userTypes?: string[];
  programCourseIds?: number[];
  streamIds?: number[];
  affiliationIds?: number[];
  regulationTypeIds?: number[];
  classIds?: number[];
  shiftIds?: number[];
  /** createdAt window in days; null/undefined = all time */
  days?: number | null;
};

/**
 * Active promotion only — mirrors realtime-tracker's ACTIVE_PROMOTION_SQL so a
 * student contributes one cohort row (no multi-semester fan-out). Kept in the
 * JOIN condition so staff/unlinked users keep their notification rows.
 */
const ACTIVE_PROMOTION_JOIN = () =>
  and(
    eq(promotionModel.studentId, studentModel.id),
    sql`${promotionModel.endDate} IS NULL`,
    sql`COALESCE(${promotionModel.isDeprecated}, false) = false`,
    eq(promotionModel.isAlumni, false),
  );

function dashWhere(f: DashboardFilters): SQL | undefined {
  const parts: SQL[] = [notInternal()];
  if (f.variants?.length)
    parts.push(inArray(notificationModel.variant, f.variants as never[]));
  if (f.statuses?.length)
    parts.push(inArray(notificationModel.status, f.statuses as never[]));
  if (f.userTypes?.length)
    parts.push(inArray(userModel.type, f.userTypes as never[]));
  if (f.academicYearIds?.length)
    parts.push(inArray(sessionModel.academicYearId, f.academicYearIds));
  if (f.programCourseIds?.length)
    parts.push(inArray(promotionModel.programCourseId, f.programCourseIds));
  if (f.classIds?.length)
    parts.push(inArray(promotionModel.classId, f.classIds));
  if (f.shiftIds?.length)
    parts.push(inArray(promotionModel.shiftId, f.shiftIds));
  if (f.streamIds?.length)
    parts.push(inArray(programCourseModel.streamId, f.streamIds));
  if (f.affiliationIds?.length)
    parts.push(inArray(programCourseModel.affiliationId, f.affiliationIds));
  if (f.regulationTypeIds?.length)
    parts.push(
      inArray(programCourseModel.regulationTypeId, f.regulationTypeIds),
    );
  if (f.days && f.days > 0)
    parts.push(
      sql`${notificationModel.createdAt} >= now() - (${f.days} * interval '1 day')`,
    );
  return parts.length ? and(...parts) : undefined;
}

type DimBucket = { key: string; label: string; count: number };

const toDimBuckets = (
  rows: Array<{ key: unknown; label: unknown; count: number | string }>,
  nullLabel = "Staff / Other",
): DimBucket[] =>
  rows
    .map((r) => ({
      key: r.key == null ? "OTHER" : String(r.key),
      label: r.label == null ? nullLabel : String(r.label),
      count: Number(r.count),
    }))
    .sort((a, b) => b.count - a.count);

export async function getDashboard(f: DashboardFilters) {
  const where = dashWhere(f);

  // Full spine: notifications → users → students → active promotion →
  // program_courses / sessions. LEFT JOINs so non-student recipients stay.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spined = (selection: any) =>
    db
      .select(selection)
      .from(notificationModel)
      .leftJoin(userModel, eq(userModel.id, notificationModel.userId))
      .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
      .leftJoin(promotionModel, ACTIVE_PROMOTION_JOIN())
      .leftJoin(
        programCourseModel,
        eq(programCourseModel.id, promotionModel.programCourseId),
      )
      .leftJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId));

  const nid = notificationModel.id;

  const totalsP = spined({
    total: countDistinct(nid),
    sent: sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'SENT')`.mapWith(
      Number,
    ),
    pending:
      sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'PENDING')`.mapWith(
        Number,
      ),
    failed:
      sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'FAILED')`.mapWith(
        Number,
      ),
    today:
      sql<number>`count(distinct ${nid}) filter (where ${notificationModel.createdAt} >= date_trunc('day', now()))`.mapWith(
        Number,
      ),
    automated:
      sql<number>`count(distinct ${nid}) filter (where ${notificationModel.notificationEventId} is null)`.mapWith(
        Number,
      ),
    eventTriggered:
      sql<number>`count(distinct ${nid}) filter (where ${notificationModel.notificationEventId} is not null)`.mapWith(
        Number,
      ),
  }).where(where);

  const trendP = spined({
    date: sql<string>`to_char(date_trunc('day', ${notificationModel.createdAt}), 'YYYY-MM-DD')`,
    sent: sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'SENT')`.mapWith(
      Number,
    ),
    failed:
      sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'FAILED')`.mapWith(
        Number,
      ),
    pending:
      sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'PENDING')`.mapWith(
        Number,
      ),
  })
    .where(where)
    .groupBy(sql`date_trunc('day', ${notificationModel.createdAt})`)
    .orderBy(sql`date_trunc('day', ${notificationModel.createdAt})`);

  const byVariantP = spined({
    variant: notificationModel.variant,
    total: countDistinct(nid),
    sent: sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'SENT')`.mapWith(
      Number,
    ),
    failed:
      sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'FAILED')`.mapWith(
        Number,
      ),
    pending:
      sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'PENDING')`.mapWith(
        Number,
      ),
  })
    .where(where)
    .groupBy(notificationModel.variant);

  const byUserTypeP = spined({
    key: userModel.type,
    label: userModel.type,
    count: countDistinct(nid),
  })
    .where(where)
    .groupBy(userModel.type);

  const byProgramCourseP = spined({
    key: programCourseModel.id,
    label: programCourseModel.name,
    count: countDistinct(nid),
  })
    .where(where)
    .groupBy(programCourseModel.id, programCourseModel.name);

  const byClassP = spined({
    key: classModel.id,
    label: classModel.name,
    count: countDistinct(nid),
  })
    .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
    .where(where)
    .groupBy(classModel.id, classModel.name);

  const byShiftP = spined({
    key: shiftModel.id,
    label: shiftModel.name,
    count: countDistinct(nid),
  })
    .leftJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .where(where)
    .groupBy(shiftModel.id, shiftModel.name);

  const byAcademicYearP = spined({
    key: academicYearModel.id,
    label: academicYearModel.year,
    count: countDistinct(nid),
  })
    .leftJoin(
      academicYearModel,
      eq(academicYearModel.id, sessionModel.academicYearId),
    )
    .where(where)
    .groupBy(academicYearModel.id, academicYearModel.year);

  const byStreamP = spined({
    key: streamModel.id,
    label: streamModel.name,
    count: countDistinct(nid),
  })
    .leftJoin(streamModel, eq(streamModel.id, programCourseModel.streamId))
    .where(where)
    .groupBy(streamModel.id, streamModel.name);

  const byCourseP = spined({
    key: courseModel.id,
    label: courseModel.name,
    count: countDistinct(nid),
  })
    .leftJoin(courseModel, eq(courseModel.id, programCourseModel.courseId))
    .where(where)
    .groupBy(courseModel.id, courseModel.name);

  const byAffiliationP = spined({
    key: affiliationModel.id,
    label: affiliationModel.name,
    count: countDistinct(nid),
  })
    .leftJoin(
      affiliationModel,
      eq(affiliationModel.id, programCourseModel.affiliationId),
    )
    .where(where)
    .groupBy(affiliationModel.id, affiliationModel.name);

  const byRegulationTypeP = spined({
    key: regulationTypeModel.id,
    label: regulationTypeModel.name,
    count: countDistinct(nid),
  })
    .leftJoin(
      regulationTypeModel,
      eq(regulationTypeModel.id, programCourseModel.regulationTypeId),
    )
    .where(where)
    .groupBy(regulationTypeModel.id, regulationTypeModel.name);

  const topMastersP = spined({
    masterId: notificationMasterModel.id,
    masterName: notificationMasterModel.name,
    template: notificationMasterModel.template,
    variant: notificationMasterModel.variant,
    total: countDistinct(nid),
    sent: sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'SENT')`.mapWith(
      Number,
    ),
    failed:
      sql<number>`count(distinct ${nid}) filter (where ${notificationModel.status} = 'FAILED')`.mapWith(
        Number,
      ),
  })
    .leftJoin(
      notificationMasterModel,
      eq(notificationMasterModel.id, notificationModel.notificationMasterId),
    )
    .where(where)
    .groupBy(
      notificationMasterModel.id,
      notificationMasterModel.name,
      notificationMasterModel.template,
      notificationMasterModel.variant,
    )
    .orderBy(desc(countDistinct(nid)))
    .limit(10);

  const recentFailuresP = db
    .select({
      id: notificationModel.id,
      createdAt: notificationModel.createdAt,
      failedAt: notificationModel.failedAt,
      failedReason: notificationModel.failedReason,
      masterId: notificationModel.notificationMasterId,
      masterName: notificationMasterModel.name,
      variant: notificationModel.variant,
      userName: userModel.name,
      userEmail: userModel.email,
      userPhone: userModel.phone,
      userWhatsapp: userModel.whatsappNumber,
      studentUid: studentModel.uid,
    })
    .from(notificationModel)
    .leftJoin(
      notificationMasterModel,
      eq(notificationMasterModel.id, notificationModel.notificationMasterId),
    )
    .leftJoin(userModel, eq(userModel.id, notificationModel.userId))
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .where(and(eq(notificationModel.status, "FAILED"), notInternal()))
    .orderBy(desc(notificationModel.createdAt), desc(notificationModel.id))
    .limit(8);

  const [
    totals,
    trend,
    byVariant,
    byUserType,
    byProgramCourse,
    byClass,
    byShift,
    byAcademicYear,
    byStream,
    byCourse,
    byAffiliation,
    byRegulationType,
    topMasters,
    recentFailures,
  ] = (await Promise.all([
    totalsP,
    trendP,
    byVariantP,
    byUserTypeP,
    byProgramCourseP,
    byClassP,
    byShiftP,
    byAcademicYearP,
    byStreamP,
    byCourseP,
    byAffiliationP,
    byRegulationTypeP,
    topMastersP,
    recentFailuresP,
    // The spined() helper takes an untyped selection, so drizzle can't infer
    // flat row shapes here — runtime rows ARE flat; normalize types below.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ])) as any[];

  const t = totals[0];
  const total = Number(t?.total ?? 0);
  const sent = Number(t?.sent ?? 0);

  return {
    filters: f,
    totals: {
      total,
      sent,
      pending: Number(t?.pending ?? 0),
      failed: Number(t?.failed ?? 0),
      today: Number(t?.today ?? 0),
      successRate: total > 0 ? Math.round((sent / total) * 1000) / 10 : 0,
    },
    byTrigger: {
      automated: Number(t?.automated ?? 0),
      eventTriggered: Number(t?.eventTriggered ?? 0),
    },
    trend: trend.map((r: any) => ({
      date: String(r.date),
      sent: Number(r.sent),
      failed: Number(r.failed),
      pending: Number(r.pending),
    })),
    byVariant: byVariant.map((r: any) => ({
      variant: String(r.variant),
      total: Number(r.total),
      sent: Number(r.sent),
      failed: Number(r.failed),
      pending: Number(r.pending),
    })),
    byUserType: toDimBuckets(byUserType, "Unknown"),
    byProgramCourse: toDimBuckets(byProgramCourse),
    byClass: toDimBuckets(byClass),
    byShift: toDimBuckets(byShift),
    byAcademicYear: toDimBuckets(byAcademicYear),
    byStream: toDimBuckets(byStream),
    byCourse: toDimBuckets(byCourse),
    byAffiliation: toDimBuckets(byAffiliation),
    byRegulationType: toDimBuckets(byRegulationType),
    topMasters: topMasters.map((m: any) => ({
      masterId: m.masterId == null ? null : Number(m.masterId),
      masterName: m.masterName == null ? "(No master)" : String(m.masterName),
      template: m.template == null ? null : String(m.template),
      variant: m.variant == null ? null : String(m.variant),
      total: Number(m.total),
      sent: Number(m.sent),
      failed: Number(m.failed),
    })),
    recentFailures,
  };
}

// ---------------------------------------------------------------------------
// Export (list rows, capped)
// ---------------------------------------------------------------------------

const EXPORT_CAP = 10_000;

export async function exportNotifications(
  f: Omit<NotificationListFilters, "page" | "limit">,
) {
  const where = buildWhere({ ...f, page: 1, limit: EXPORT_CAP });
  return db
    .select(notificationRow)
    .from(notificationModel)
    .leftJoin(
      notificationMasterModel,
      eq(notificationMasterModel.id, notificationModel.notificationMasterId),
    )
    .leftJoin(userModel, eq(userModel.id, notificationModel.userId))
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .where(where)
    .orderBy(desc(notificationModel.createdAt), desc(notificationModel.id))
    .limit(EXPORT_CAP);
}

export async function getStats() {
  const [totals] = await db
    .select({
      total: count(),
      sent: sql<number>`count(*) filter (where ${notificationModel.status} = 'SENT')`.mapWith(
        Number,
      ),
      pending:
        sql<number>`count(*) filter (where ${notificationModel.status} = 'PENDING')`.mapWith(
          Number,
        ),
      failed:
        sql<number>`count(*) filter (where ${notificationModel.status} = 'FAILED')`.mapWith(
          Number,
        ),
      today:
        sql<number>`count(*) filter (where ${notificationModel.createdAt} >= date_trunc('day', now()))`.mapWith(
          Number,
        ),
    })
    .from(notificationModel)
    .where(notInternal());

  const byVariant = await db
    .select({
      variant: notificationModel.variant,
      count: count(),
    })
    .from(notificationModel)
    .where(notInternal())
    .groupBy(notificationModel.variant);

  const recent = await db
    .select(notificationRow)
    .from(notificationModel)
    .leftJoin(
      notificationMasterModel,
      eq(notificationMasterModel.id, notificationModel.notificationMasterId),
    )
    .leftJoin(userModel, eq(userModel.id, notificationModel.userId))
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .where(notInternal())
    .orderBy(desc(notificationModel.createdAt), desc(notificationModel.id))
    .limit(10);

  return {
    totals: {
      total: Number(totals?.total ?? 0),
      sent: Number(totals?.sent ?? 0),
      pending: Number(totals?.pending ?? 0),
      failed: Number(totals?.failed ?? 0),
      today: Number(totals?.today ?? 0),
    },
    byVariant: byVariant.map((v) => ({
      variant: String(v.variant),
      count: Number(v.count),
    })),
    recent,
  };
}
