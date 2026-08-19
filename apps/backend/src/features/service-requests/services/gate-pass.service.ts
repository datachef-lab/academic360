import crypto from "crypto";
import { db } from "@/db/index.js";
import { serviceGatePassesModel } from "@repo/db/schemas/models/service-requests/service-gate-passes.model.js";
import { serviceTicketEventsModel } from "@repo/db/schemas/models/service-requests/service-ticket-events.model.js";
import { serviceTicketsModel } from "@repo/db/schemas/models/service-requests/service-tickets.model.js";
import { serviceSlotBookingsModel } from "@repo/db/schemas/models/service-requests/service-slot-bookings.model.js";
import { serviceSlotInstancesModel } from "@repo/db/schemas/models/service-requests/service-slot-instances.model.js";
import { serviceAlumniIntakeModel } from "@repo/db/schemas/models/service-requests/service-alumni-intake.model.js";
import { serviceTypeRoutingModel } from "@repo/db/schemas/models/service-requests/service-type-routing.model.js";
import { departmentModel } from "@repo/db/schemas/models/administration/department.model.js";
import { eq, sql, inArray } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { QRCodeService } from "@/services/qr-code.service.js";
import { enqueueNotification } from "@/services/notificationClient.js";
import { notificationMasterModel } from "@repo/db/schemas/models/notifications";
import { and } from "drizzle-orm";
import { transition } from "./ticket.service.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Grace period (minutes) added before/after the slot window for gate pass validity */
const GATE_PASS_GRACE_MINUTES = 30;

/** Base URL for the gate scan endpoint (falls back to localhost) */
const GATE_SCAN_BASE = process.env.GATE_SCAN_BASE_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GatePassPayload {
  ticketId: number;
  referenceId: string;
  visitorName: string;
  userType: "STUDENT" | "ALUMNI";
  approvedDate: string; // ISO date string
  timeSlot: string; // e.g. "10:00 AM – 11:00 AM"
  destinationDept: string;
}

// Drizzle transaction handle type — lets the caller thread its own tx in so
// the gate-pass inserts run on the SAME connection as the booking transaction
// (avoids a cross-connection FK-lock deadlock on the service_tickets row).
type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface IssueGatePassInput {
  ticketId: number;
  slotBookingId: number;
  slotInst: typeof serviceSlotInstancesModel.$inferSelect;
  ticket: typeof serviceTicketsModel.$inferSelect;
  /** When invoked inside a booking transaction, pass it here. */
  tx?: DbOrTx;
}

// ---------------------------------------------------------------------------
// issueGatePass
// ---------------------------------------------------------------------------

/**
 * Issues a new gate pass for a slot booking.
 *
 * - nonce = crypto.randomBytes(32).toString("base64url")  (opaque, 256-bit)
 * - QR encodes ONLY the scan URL …/gate/verify?t=<nonce>
 * - Dispatches QR + payload via notification queue (email + WhatsApp)
 */
export async function issueGatePass(
  input: IssueGatePassInput,
): Promise<typeof serviceGatePassesModel.$inferSelect> {
  const { ticketId, slotBookingId, slotInst, ticket } = input;
  // Use the caller's transaction when provided so inserts share its connection.
  const exec = input.tx ?? db;

  // Build valid window with grace
  const validFrom = new Date(slotInst.startAt.getTime() - GATE_PASS_GRACE_MINUTES * 60_000);
  const validUntil = new Date(slotInst.endAt.getTime() + GATE_PASS_GRACE_MINUTES * 60_000);

  // Resolve visitor name
  let visitorName = "Visitor";
  if (ticket.requestorType === "ALUMNI" && ticket.alumniIntakeId) {
    const [intake] = await exec
      .select({ fullName: serviceAlumniIntakeModel.fullName })
      .from(serviceAlumniIntakeModel)
      .where(eq(serviceAlumniIntakeModel.id, ticket.alumniIntakeId));
    visitorName = intake?.fullName ?? visitorName;
  } else if (ticket.requestorType === "STUDENT" && ticket.studentUserId) {
    const { userModel } = await import("@repo/db/schemas/models/user");
    const [user] = await exec
      .select({ name: userModel.name })
      .from(userModel)
      .where(eq(userModel.id, ticket.studentUserId));
    visitorName = user?.name ?? visitorName;
  }

  // Resolve department name
  let destinationDept = "Administration";
  if (ticket.departmentId) {
    const [dept] = await exec
      .select({ name: departmentModel.name })
      .from(departmentModel)
      .where(eq(departmentModel.id, ticket.departmentId));
    destinationDept = (dept as any)?.name ?? destinationDept;
  }

  // Format time slot string
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  const timeSlot = `${fmt(slotInst.startAt)} – ${fmt(slotInst.endAt)}`;
  const approvedDate = slotInst.startAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

  // Build payload (human-readable, NOT embedded in QR)
  const payload: GatePassPayload = {
    ticketId,
    referenceId: ticket.referenceId,
    visitorName,
    userType: ticket.requestorType,
    approvedDate,
    timeSlot,
    destinationDept,
  };

  // Generate opaque nonce
  const nonce = crypto.randomBytes(32).toString("base64url");

  // Scan URL (only the nonce goes in the QR)
  const scanUrl = `${GATE_SCAN_BASE}/gate/verify?t=${encodeURIComponent(nonce)}`;

  // Generate QR code
  const qrDataUrl = await QRCodeService.generateQRCodeDataURL(scanUrl, { size: 300 });

  // Persist gate pass
  const [gatePass] = await exec
    .insert(serviceGatePassesModel)
    .values({
      ticketId,
      slotBookingId,
      nonce,
      payload: payload as any,
      status: "ACTIVE",
      validFrom,
      validUntil,
      isBypass: false,
    })
    .returning();

  // Append GATE_PASS_ISSUED event
  await exec.insert(serviceTicketEventsModel).values({
    ticketId,
    eventType: "GATE_PASS_ISSUED",
    fromStatus: null,
    toStatus: null,
    actorUserId: null,
    metadata: { gatePassId: gatePass.id, nonce: "[redacted]" } as any,
  });

  // Dispatch notification (best-effort — errors are logged, not thrown)
  dispatchGatePassNotification({
    ticket,
    gatePass,
    payload,
    qrDataUrl,
    scanUrl,
  }).catch((e) => {
    console.error("[gate-pass.service] Notification dispatch failed", e);
  });

  return gatePass;
}

// ---------------------------------------------------------------------------
// dispatchGatePassNotification (best-effort, fire-and-forget)
// ---------------------------------------------------------------------------

async function dispatchGatePassNotification(opts: {
  ticket: typeof serviceTicketsModel.$inferSelect;
  gatePass: typeof serviceGatePassesModel.$inferSelect;
  payload: GatePassPayload;
  qrDataUrl: string;
  scanUrl: string;
}): Promise<void> {
  const { ticket, payload, qrDataUrl, scanUrl } = opts;

  // Resolve contact info for notifications
  let email = ticket.contactEmail ?? "";
  let phone = ticket.contactPhone ?? "";

  if (ticket.requestorType === "ALUMNI" && ticket.alumniIntakeId) {
    const [intake] = await db
      .select({
        email: serviceAlumniIntakeModel.email,
        mobileWhatsapp: serviceAlumniIntakeModel.mobileWhatsapp,
      })
      .from(serviceAlumniIntakeModel)
      .where(eq(serviceAlumniIntakeModel.id, ticket.alumniIntakeId));
    email = intake?.email ?? email;
    phone = intake?.mobileWhatsapp ?? phone;
  }

  if (!email && !phone) {
    console.warn(`[gate-pass.service] No contact info for ticket ${ticket.id}, skipping notification`);
    return;
  }

  // Look up notification masters (OTP masters re-used for simplicity;
  // a dedicated gate-pass master should be added in Phase 6)
  const [emailMaster] = await db
    .select()
    .from(notificationMasterModel)
    .where(
      and(
        eq(notificationMasterModel.name, "OTP"),
        eq(notificationMasterModel.variant, "EMAIL"),
      ),
    );

  if (emailMaster && email) {
    await enqueueNotification({
      userId: ticket.studentUserId ?? 0,
      variant: "EMAIL",
      type: "OTP",
      message: `Your campus gate pass for ${payload.referenceId}`,
      notificationMasterId: emailMaster.id,
      notificationEvent: {
        subject: `Campus Gate Pass — ${payload.referenceId}`,
        emailTemplate: "otp",
        templateData: {
          greetingName: payload.visitorName,
          referenceId: payload.referenceId,
          timeSlot: payload.timeSlot,
          approvedDate: payload.approvedDate,
          destinationDept: payload.destinationDept,
          scanUrl,
          qrDataUrl,
        },
      } as any,
    });
  }

  // WhatsApp notification (if phone available)
  if (phone) {
    const [waMaster] = await db
      .select()
      .from(notificationMasterModel)
      .where(
        and(
          eq(notificationMasterModel.name, "OTP"),
          eq(notificationMasterModel.variant, "WHATSAPP"),
        ),
      );

    if (waMaster) {
      await enqueueNotification({
        userId: ticket.studentUserId ?? 0,
        variant: "WHATSAPP",
        type: "OTP",
        message: `Gate pass for ${payload.referenceId} — Time: ${payload.timeSlot}`,
        notificationMasterId: waMaster.id,
        notificationEvent: {
          templateData: {
            greetingName: payload.visitorName,
            referenceId: payload.referenceId,
            timeSlot: payload.timeSlot,
            destinationDept: payload.destinationDept,
          },
          bodyValues: [payload.visitorName, payload.referenceId],
        } as any,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// scanGatePass  — ATOMIC check-in (single conditional UPDATE)
// ---------------------------------------------------------------------------

export type ScanResult =
  | { status: "GREEN"; gatePassId: number; ticketId: number; payload: GatePassPayload }
  | { status: "RED"; reason: "NOT_FOUND" | "ALREADY_USED" | "EXPIRED" | "OUTSIDE_WINDOW" | "REVOKED" };

/**
 * Atomically marks the gate pass as USED.
 * Returns GREEN (row returned) or RED (follow-up SELECT to disambiguate).
 *
 * This is safe under concurrent scans — only one UPDATE will match.
 */
export async function scanGatePass(
  nonce: string,
  guardUserId: number,
): Promise<ScanResult> {
  // ATOMIC conditional UPDATE — single source of truth
  const updateResult = await db.execute(
    sql`
      UPDATE service_gate_passes
         SET status               = 'USED',
             checked_in_at        = now(),
             checked_in_by_user_id = ${guardUserId},
             updated_at           = now()
       WHERE nonce  = ${nonce}
         AND status IN ('ACTIVE', 'BYPASS')
         AND now() BETWEEN valid_from AND valid_until
      RETURNING id, ticket_id, payload
    `,
  );

  if (updateResult.rows.length > 0) {
    const row = updateResult.rows[0] as any;
    const gatePassId: number = row.id;
    const ticketId: number = row.ticket_id;
    const payload: GatePassPayload = row.payload as GatePassPayload;

    // Transition ticket → CHECKED_IN
    await transition(ticketId, "CHECKED_IN", { userId: guardUserId }, {
      eventType: "CHECKED_IN",
      metadata: { gatePassId, guardUserId },
    });

    // Update the slot booking status to CHECKED_IN
    await db
      .update(serviceSlotBookingsModel)
      .set({ status: "CHECKED_IN", updatedAt: new Date() })
      .where(
        and(
          eq(serviceSlotBookingsModel.ticketId, ticketId),
          inArray(serviceSlotBookingsModel.status, ["BOOKED"]),
        ),
      );

    return { status: "GREEN", gatePassId, ticketId, payload };
  }

  // RED path — disambiguate reason for guard UI
  const [existing] = await db
    .select({
      id: serviceGatePassesModel.id,
      status: serviceGatePassesModel.status,
      validFrom: serviceGatePassesModel.validFrom,
      validUntil: serviceGatePassesModel.validUntil,
    })
    .from(serviceGatePassesModel)
    .where(eq(serviceGatePassesModel.nonce, nonce));

  if (!existing) {
    return { status: "RED", reason: "NOT_FOUND" };
  }
  if (existing.status === "USED") {
    return { status: "RED", reason: "ALREADY_USED" };
  }
  if (existing.status === "EXPIRED" || existing.status === "REVOKED") {
    return { status: "RED", reason: "EXPIRED" };
  }

  const now = new Date();
  if (now < existing.validFrom || now > existing.validUntil) {
    return { status: "RED", reason: "OUTSIDE_WINDOW" };
  }

  return { status: "RED", reason: "REVOKED" };
}

// ---------------------------------------------------------------------------
// revokeGatePassForBooking  — called by slot cancel/reschedule
// ---------------------------------------------------------------------------

export async function revokeGatePassForBooking(
  slotBookingId: number,
  tx?: Parameters<Parameters<typeof db.transaction>[0]>[0],
): Promise<void> {
  const executor = tx ?? db;
  await (executor as typeof db).execute(
    sql`
      UPDATE service_gate_passes
         SET status     = 'REVOKED',
             revoked_at = now(),
             updated_at = now()
       WHERE slot_booking_id_fk = ${slotBookingId}
         AND status IN ('ACTIVE', 'BYPASS')
    `,
  );
}

// ---------------------------------------------------------------------------
// issueBypasPass  — override / temporary bypass
// ---------------------------------------------------------------------------

/**
 * Issues a bypass gate pass (isBypass=true, status=BYPASS) that is NOT tied to
 * a slot booking. Used for guard/admin overrides.
 *
 * The previous active pass is revoked and stored in supersedesGatePassId.
 * A BYPASS_ISSUED event is audited.
 *
 * @param validMinutes  How long the bypass pass is valid (default 60)
 */
export async function issueBypassPass(
  ticketId: number,
  issuedByUserId: number,
  validMinutes: number = 60,
): Promise<typeof serviceGatePassesModel.$inferSelect> {
  const [ticket] = await db
    .select()
    .from(serviceTicketsModel)
    .where(eq(serviceTicketsModel.id, ticketId));

  if (!ticket) throw new ApiError(404, `Ticket ${ticketId} not found`);

  // Find and revoke the existing active pass (if any)
  const [existingPass] = await db
    .select({ id: serviceGatePassesModel.id })
    .from(serviceGatePassesModel)
    .where(
      and(
        eq(serviceGatePassesModel.ticketId, ticketId),
        inArray(serviceGatePassesModel.status, ["ACTIVE", "BYPASS"]),
      ),
    );

  if (existingPass) {
    await db
      .update(serviceGatePassesModel)
      .set({ status: "REVOKED", revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(serviceGatePassesModel.id, existingPass.id));
  }

  const now = new Date();
  const validFrom = now;
  const validUntil = new Date(now.getTime() + validMinutes * 60_000);
  const nonce = crypto.randomBytes(32).toString("base64url");
  const scanUrl = `${GATE_SCAN_BASE}/gate/verify?t=${encodeURIComponent(nonce)}`;

  // Build minimal bypass payload
  let visitorName = "Visitor";
  if (ticket.requestorType === "ALUMNI" && ticket.alumniIntakeId) {
    const [intake] = await db
      .select({ fullName: serviceAlumniIntakeModel.fullName })
      .from(serviceAlumniIntakeModel)
      .where(eq(serviceAlumniIntakeModel.id, ticket.alumniIntakeId));
    visitorName = intake?.fullName ?? visitorName;
  }

  let destinationDept = "Administration";
  if (ticket.departmentId) {
    const [dept] = await db
      .select({ name: departmentModel.name })
      .from(departmentModel)
      .where(eq(departmentModel.id, ticket.departmentId));
    destinationDept = (dept as any)?.name ?? destinationDept;
  }

  const payload: GatePassPayload = {
    ticketId,
    referenceId: ticket.referenceId,
    visitorName,
    userType: ticket.requestorType,
    approvedDate: now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
    timeSlot: `Bypass — valid ${validMinutes} min`,
    destinationDept,
  };

  const [bypassPass] = await db
    .insert(serviceGatePassesModel)
    .values({
      ticketId,
      slotBookingId: null,
      nonce,
      payload: payload as any,
      status: "BYPASS",
      validFrom,
      validUntil,
      isBypass: true,
      supersedesGatePassId: existingPass?.id ?? null,
    })
    .returning();

  // Audit event
  await db.insert(serviceTicketEventsModel).values({
    ticketId,
    eventType: "BYPASS_ISSUED",
    fromStatus: null,
    toStatus: null,
    actorUserId: issuedByUserId,
    metadata: {
      bypassPassId: bypassPass.id,
      revokedPassId: existingPass?.id ?? null,
      validMinutes,
    } as any,
  });

  return bypassPass;
}

// ---------------------------------------------------------------------------
// getGatePassByTicketId  — for rendering the pass to the requestor
// ---------------------------------------------------------------------------

export async function getActiveGatePassForTicket(
  ticketId: number,
): Promise<(typeof serviceGatePassesModel.$inferSelect & { qrDataUrl: string }) | null> {
  const [gatePass] = await db
    .select()
    .from(serviceGatePassesModel)
    .where(
      and(
        eq(serviceGatePassesModel.ticketId, ticketId),
        inArray(serviceGatePassesModel.status, ["ACTIVE", "BYPASS"]),
      ),
    );

  if (!gatePass) return null;

  const scanUrl = `${GATE_SCAN_BASE}/gate/verify?t=${encodeURIComponent(gatePass.nonce)}`;
  const qrDataUrl = await QRCodeService.generateQRCodeDataURL(scanUrl, { size: 300 });

  return { ...gatePass, qrDataUrl };
}
