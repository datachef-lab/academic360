import { db } from "@/db/index.js";
import { serviceTicketsModel } from "@repo/db/schemas/models/service-requests/service-tickets.model.js";
import { serviceAlumniIntakeModel } from "@repo/db/schemas/models/service-requests/service-alumni-intake.model.js";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { createOtp, verifyOtp } from "@/features/auth/services/otp.service.js";
import { sendOtpNotifications } from "@/services/otpNotification.service.js";
import { markContactVerified } from "./alumni-intake.service.js";
import { transition } from "./ticket.service.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** OTP validity for service-request contact verification (spec: 10 minutes) */
const SR_OTP_EXPIRY_MINUTES = 10;

// ---------------------------------------------------------------------------
// sendContactVerificationOtp
//
// Sends a single 6-digit code to BOTH email AND WhatsApp for an alumni intake.
// ---------------------------------------------------------------------------

export interface SendOtpResult {
  email: { success: boolean; error?: string | null };
  whatsapp: { success: boolean; error?: string | null };
}

/**
 * Generates OTP records for both email and phone, then dispatches them via
 * the dual-channel sendOtpNotifications helper.
 *
 * One code is sent to email; a separate OTP record is created for phone so
 * verifyOtp can validate either channel independently.
 */
export async function sendContactVerificationOtp(
  intakeId: number,
): Promise<SendOtpResult> {
  const [intake] = await db
    .select()
    .from(serviceAlumniIntakeModel)
    .where(eq(serviceAlumniIntakeModel.id, intakeId));

  if (!intake) {
    throw new ApiError(404, `Alumni intake ${intakeId} not found`);
  }

  // Generate one shared code for both channels (same value stored twice)
  // This is intentional — the user receives the same 6-digit code on both channels.
  const emailOtp = await createOtp(intake.email, "FOR_EMAIL", SR_OTP_EXPIRY_MINUTES);

  // Also create a FOR_PHONE record keyed on mobileWhatsapp so WhatsApp
  // delivery and verification are self-consistent.
  await createOtp(intake.mobileWhatsapp, "FOR_PHONE", SR_OTP_EXPIRY_MINUTES);

  // Use the same OTP code for both channels (send the email code)
  const result = await sendOtpNotifications({
    email: intake.email,
    phoneNumber: intake.mobileWhatsapp,
    otpCode: emailOtp.otp,
    userName: intake.fullName,
    expiryMinutes: SR_OTP_EXPIRY_MINUTES,
  });

  return {
    email: { success: result.email.success, error: result.email.error },
    whatsapp: { success: result.whatsapp.success, error: result.whatsapp.error },
  };
}

// ---------------------------------------------------------------------------
// verifyContactOtp
//
// Verifies the OTP (email channel). On success:
//   1. Marks intake.contactVerified = true
//   2. Updates ticket.contactVerified = true (if ticketId provided)
//   3. Appends OTP_VERIFIED event to ticket (does NOT change ticket status)
// ---------------------------------------------------------------------------

export interface VerifyOtpInput {
  intakeId: number;
  otpCode: string;
  /** Optional: update the linked ticket after successful verification */
  ticketId?: number;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  /** Issued only on success: hardened single-purpose token to submit/track the ticket. */
  referenceToken?: string;
  ticketId?: number;
}

export async function verifyContactOtp(
  input: VerifyOtpInput,
): Promise<VerifyOtpResult> {
  const [intake] = await db
    .select()
    .from(serviceAlumniIntakeModel)
    .where(eq(serviceAlumniIntakeModel.id, input.intakeId));

  if (!intake) {
    throw new ApiError(404, `Alumni intake ${input.intakeId} not found`);
  }

  // Verify against the email OTP record (authoritative channel)
  const verifyResult = await verifyOtp(intake.email, input.otpCode, "FOR_EMAIL");

  if (!verifyResult.success) {
    return { success: false, message: verifyResult.message };
  }

  // Mark intake as contact-verified
  await markContactVerified(input.intakeId);

  // Resolve the linked DRAFT ticket: prefer the supplied ticketId, else find the
  // ticket created for this intake at intake time.
  let ticketId = input.ticketId;
  if (!ticketId) {
    const [linked] = await db
      .select({ id: serviceTicketsModel.id })
      .from(serviceTicketsModel)
      .where(eq(serviceTicketsModel.alumniIntakeId, input.intakeId));
    ticketId = linked?.id;
  }

  if (ticketId) {
    await db
      .update(serviceTicketsModel)
      .set({ contactVerified: true, updatedAt: new Date() })
      .where(eq(serviceTicketsModel.id, ticketId));

    // Append audit event (not a status transition — just a lifecycle event)
    const { serviceTicketEventsModel } = await import(
      "@repo/db/schemas/models/service-requests/service-ticket-events.model.js"
    );
    await db.insert(serviceTicketEventsModel).values({
      ticketId,
      eventType: "OTP_VERIFIED",
      fromStatus: null,
      toStatus: null,
      actorUserId: null,
      metadata: { channel: "email", intakeId: input.intakeId } as any,
    });
  }

  // Mint the hardened, single-purpose reference token bound to THIS ticket+intake.
  const { signAlumniReferenceToken } = await import("../reference-token.js");
  const referenceToken = ticketId
    ? signAlumniReferenceToken({ ticketId, intakeId: input.intakeId })
    : undefined;

  return {
    success: true,
    message: "Contact verified successfully",
    referenceToken,
    ticketId,
  };
}

// ---------------------------------------------------------------------------
// submitAlumniTicket
//
// Full alumni submission flow:
//   1. Verify contactVerified guard
//   2. Transition DRAFT → SUBMITTED
//   3. Auto-route (SUBMITTED → ROUTED) via routing.service
//   4. Return reference token (short-lived JWT for tracking only)
// ---------------------------------------------------------------------------

export interface SubmitAlumniTicketInput {
  ticketId: number;
  intakeId: number;
}

export interface SubmitResult {
  referenceId: string;
}

export async function submitAlumniTicket(
  input: SubmitAlumniTicketInput,
): Promise<SubmitResult> {
  const [ticket] = await db
    .select()
    .from(serviceTicketsModel)
    .where(eq(serviceTicketsModel.id, input.ticketId));

  if (!ticket) {
    throw new ApiError(404, `Ticket ${input.ticketId} not found`);
  }

  if (!ticket.contactVerified) {
    throw new ApiError(
      403,
      "Contact must be verified before submitting the service request",
    );
  }

  // DRAFT → SUBMITTED (contactVerified guard is re-checked inside transition())
  await transition(input.ticketId, "SUBMITTED", {}, { eventType: "SUBMITTED" });

  // Auto-route: SUBMITTED → ROUTED
  const { routeTicket } = await import("./routing.service.js");
  await routeTicket(input.ticketId);

  // Re-fetch for final referenceId
  const [updated] = await db
    .select({ referenceId: serviceTicketsModel.referenceId })
    .from(serviceTicketsModel)
    .where(eq(serviceTicketsModel.id, input.ticketId));

  return {
    referenceId: updated.referenceId,
  };
}
