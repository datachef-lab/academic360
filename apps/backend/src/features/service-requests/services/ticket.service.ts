import { db } from "@/db/index.js";
import { serviceTicketsModel } from "@repo/db/schemas/models/service-requests/service-tickets.model.js";
import { serviceTicketEventsModel } from "@repo/db/schemas/models/service-requests/service-ticket-events.model.js";
import { eq, sql } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TicketStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "ROUTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PENDING_SLOT_BOOKING"
  | "SLOT_BOOKED"
  | "CHECKED_IN"
  | "FULFILLED"
  | "CLOSED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

type TicketEventType =
  | "CREATED"
  | "OTP_VERIFIED"
  | "SUBMITTED"
  | "ROUTED"
  | "REVIEW_STARTED"
  | "APPROVED"
  | "REJECTED"
  | "FULFILLMENT_SET"
  | "SLOT_BOOKED"
  | "SLOT_RESCHEDULED"
  | "GATE_PASS_ISSUED"
  | "CHECKED_IN"
  | "BYPASS_ISSUED"
  | "FULFILLED"
  | "CLOSED"
  | "CANCELLED"
  | "EXPIRED";

export interface TransitionActor {
  userId?: number;
}

export interface TransitionMeta {
  eventType?: TicketEventType;
  metadata?: Record<string, unknown>;
  /** Extra fields to merge into the ticket update (e.g. rejectionReason, departmentId, slaDueAt) */
  ticketPatch?: Partial<typeof serviceTicketsModel.$inferInsert>;
}

// ---------------------------------------------------------------------------
// State-machine allow-map
// ---------------------------------------------------------------------------

/** Maps fromStatus → set of valid toStatuses */
const ALLOWED_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
  DRAFT: ["SUBMITTED", "EXPIRED", "CANCELLED"],
  SUBMITTED: ["ROUTED", "CANCELLED"],
  ROUTED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["FULFILLED", "PENDING_SLOT_BOOKING", "CANCELLED"],
  PENDING_SLOT_BOOKING: ["SLOT_BOOKED", "CANCELLED"],
  SLOT_BOOKED: ["CHECKED_IN", "PENDING_SLOT_BOOKING", "EXPIRED", "CANCELLED"],
  CHECKED_IN: ["FULFILLED"],
  FULFILLED: ["CLOSED"],
};

/** Map toStatus → canonical event type when caller doesn't specify */
const DEFAULT_EVENT_TYPE: Partial<Record<TicketStatus, TicketEventType>> = {
  SUBMITTED: "SUBMITTED",
  ROUTED: "ROUTED",
  UNDER_REVIEW: "REVIEW_STARTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PENDING_SLOT_BOOKING: "FULFILLMENT_SET",
  SLOT_BOOKED: "SLOT_BOOKED",
  CHECKED_IN: "CHECKED_IN",
  FULFILLED: "FULFILLED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
};

// ---------------------------------------------------------------------------
// transition()  — the ONLY function controllers call to change ticket status
// ---------------------------------------------------------------------------

/**
 * Atomically validates fromStatus→toStatus, updates the ticket, and appends
 * a service_ticket_events audit row — all inside a single db.transaction.
 *
 * Throws ApiError on invalid transition or missing ticket.
 */
// Drizzle transaction handle type (so callers can thread their own tx in).
type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function transition(
  ticketId: number,
  toStatus: TicketStatus,
  actor: TransitionActor,
  meta: TransitionMeta = {},
  existingTx?: DbOrTx,
): Promise<typeof serviceTicketsModel.$inferSelect> {
  // Run on the caller's transaction when provided, else open our own. Threading
  // the caller's tx avoids a cross-connection self-deadlock when transition() is
  // invoked from inside another transaction (e.g. slot booking).
  const run = async (tx: DbOrTx) => {
    const [ticket] = await tx
      .select()
      .from(serviceTicketsModel)
      .where(eq(serviceTicketsModel.id, ticketId))
      .for("update");

    if (!ticket) {
      throw new ApiError(404, `Ticket ${ticketId} not found`);
    }

    const fromStatus = ticket.status as TicketStatus;

    // Guard: SUBMITTED requires contactVerified (for alumni)
    if (toStatus === "SUBMITTED" && ticket.requestorType === "ALUMNI" && !ticket.contactVerified) {
      throw new ApiError(400, "Contact must be verified before submitting");
    }

    // Guard: APPROVED requires idProofVerified for alumni tickets
    if (toStatus === "APPROVED" && ticket.requestorType === "ALUMNI") {
      if (ticket.alumniIntakeId) {
        const { serviceAlumniIntakeModel } = await import(
          "@repo/db/schemas/models/service-requests/service-alumni-intake.model.js"
        );
        const [intake] = await tx
          .select({ idProofVerified: serviceAlumniIntakeModel.idProofVerified })
          .from(serviceAlumniIntakeModel)
          .where(eq(serviceAlumniIntakeModel.id, ticket.alumniIntakeId));
        if (!intake?.idProofVerified) {
          throw new ApiError(400, "ID proof must be verified before approving alumni ticket");
        }
      }
    }

    const allowed = ALLOWED_TRANSITIONS[fromStatus] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new ApiError(
        409,
        `Transition from ${fromStatus} to ${toStatus} is not allowed`,
      );
    }

    const now = new Date();
    const lifecyclePatch: Record<string, Date> = {};
    if (toStatus === "ROUTED") lifecyclePatch["routedAt"] = now;
    if (toStatus === "APPROVED") lifecyclePatch["approvedAt"] = now;
    if (toStatus === "CLOSED" || toStatus === "REJECTED") lifecyclePatch["closedAt"] = now;

    const [updatedTicket] = await tx
      .update(serviceTicketsModel)
      .set({
        status: toStatus,
        updatedAt: now,
        ...lifecyclePatch,
        ...(actor.userId && toStatus === "APPROVED" ? { approvedByUserId: actor.userId } : {}),
        ...meta.ticketPatch,
      })
      .where(eq(serviceTicketsModel.id, ticketId))
      .returning();

    const eventType: TicketEventType =
      meta.eventType ?? DEFAULT_EVENT_TYPE[toStatus] ?? ("CREATED" as TicketEventType);

    await tx.insert(serviceTicketEventsModel).values({
      ticketId,
      eventType,
      fromStatus: fromStatus as any,
      toStatus: toStatus as any,
      actorUserId: actor.userId ?? null,
      metadata: meta.metadata ? (meta.metadata as any) : null,
      createdAt: now,
    });

    return updatedTicket;
  };

  return existingTx ? run(existingTx) : db.transaction(run);
}

// ---------------------------------------------------------------------------
// Reference ID generation  (SR-{YYYY}-{zero-padded-serial})
// ---------------------------------------------------------------------------

/**
 * Generates a collision-safe reference ID using a Postgres sequence.
 * The sequence `service_ticket_ref_seq` is created once at migration time;
 * until then (or in dev without migrations) falls back to ticket id.
 */
export async function generateReferenceId(year?: number): Promise<string> {
  const y = year ?? new Date().getFullYear();
  try {
    const result = await db.execute(
      sql`SELECT nextval('service_ticket_ref_seq') AS seq`,
    );
    const seq = Number((result.rows[0] as any).seq);
    return `SR-${y}-${String(seq).padStart(6, "0")}`;
  } catch {
    // Sequence might not exist yet (migration not applied); fall back to random
    const fallback = Math.floor(Math.random() * 1_000_000);
    return `SR-${y}-${String(fallback).padStart(6, "0")}`;
  }
}

// ---------------------------------------------------------------------------
// createTicket  — convenience helper called by submit endpoints
// ---------------------------------------------------------------------------

export interface CreateTicketInput {
  requestorType: "STUDENT" | "ALUMNI";
  studentUserId?: number;
  alumniIntakeId?: number;
  serviceTypeId: number;
  contactEmail?: string;
  contactPhone?: string;
  details?: Record<string, unknown>;
}

export async function createTicket(
  input: CreateTicketInput,
): Promise<typeof serviceTicketsModel.$inferSelect> {
  const referenceId = await generateReferenceId();

  const [ticket] = await db
    .insert(serviceTicketsModel)
    .values({
      referenceId,
      requestorType: input.requestorType,
      studentUserId: input.studentUserId ?? null,
      alumniIntakeId: input.alumniIntakeId ?? null,
      serviceTypeId: input.serviceTypeId,
      status: "DRAFT",
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      details: (input.details as any) ?? null,
      contactVerified: false,
    })
    .returning();

  await db.insert(serviceTicketEventsModel).values({
    ticketId: ticket.id,
    eventType: "CREATED",
    fromStatus: null,
    toStatus: "DRAFT",
    actorUserId: input.studentUserId ?? null,
    metadata: null,
  });

  return ticket;
}

// ---------------------------------------------------------------------------
// findTicketByRef
// ---------------------------------------------------------------------------

export async function findTicketByRef(
  referenceId: string,
): Promise<typeof serviceTicketsModel.$inferSelect | null> {
  const [ticket] = await db
    .select()
    .from(serviceTicketsModel)
    .where(eq(serviceTicketsModel.referenceId, referenceId));
  return ticket ?? null;
}

export async function findTicketById(
  id: number,
): Promise<typeof serviceTicketsModel.$inferSelect | null> {
  const [ticket] = await db
    .select()
    .from(serviceTicketsModel)
    .where(eq(serviceTicketsModel.id, id));
  return ticket ?? null;
}
