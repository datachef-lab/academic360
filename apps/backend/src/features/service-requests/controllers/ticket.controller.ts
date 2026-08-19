import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import { verifyAlumniReferenceToken } from "../reference-token.js";
import { User } from "@repo/db/schemas/models/user";
import { db } from "@/db/index.js";
import { eq, and, inArray, desc } from "drizzle-orm";
import { serviceTicketsModel } from "@repo/db/schemas/models/service-requests/service-tickets.model.js";
import { serviceTicketEventsModel } from "@repo/db/schemas/models/service-requests/service-ticket-events.model.js";
import { serviceAlumniIntakeModel } from "@repo/db/schemas/models/service-requests/service-alumni-intake.model.js";
import { serviceTypeRoutingModel } from "@repo/db/schemas/models/service-requests/service-type-routing.model.js";
import { createTicket, findTicketByRef, findTicketById, transition } from "../services/ticket.service.js";
import { routeTicket, listServiceTypes } from "../services/routing.service.js";
import { submitAlumniTicket } from "../services/contact-verification.service.js";

// ---------------------------------------------------------------------------
// POST /submit
//
// Two paths:
//   1. Students (verifyJWT applied in router) — req.user.id is the student userId
//   2. Alumni — Authorization: Bearer <referenceToken> (short-lived JWT issued at OTP verify)
//
// Body: { serviceTypeId, details?, intakeId? (alumni only), ticketId? (alumni) }
// ---------------------------------------------------------------------------

export const submitRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { serviceTypeId, details, ticketId: bodyTicketId } = req.body as {
      serviceTypeId?: number;
      details?: Record<string, unknown>;
      ticketId?: number;
    };

    // --- ALUMNI path: reference token in Authorization header ---
    const authHeader = req.headers.authorization as string | undefined;
    const isAlumniPath = !req.user && authHeader?.startsWith("Bearer ");

    if (isAlumniPath) {
      // Validate the hardened, single-purpose alumni reference token. This is
      // a DISTINCT token type (separate secret + `kind` claim) — a user access
      // token cannot be substituted here.
      const token = authHeader!.split(" ")[1];
      const claims = verifyAlumniReferenceToken(token);
      if (!claims) {
        res.status(401).json(new ApiError(401, "Invalid or expired reference token"));
        return;
      }

      // Token carries explicit ticketId/intakeId. Reject any mismatching
      // client-supplied ticketId; never trust client intakeId.
      if (bodyTicketId !== undefined && Number(bodyTicketId) !== claims.ticketId) {
        res.status(403).json(new ApiError(403, "ticketId does not match reference token"));
        return;
      }

      const ticket = await findTicketById(claims.ticketId);
      if (
        !ticket ||
        ticket.requestorType !== "ALUMNI" ||
        !ticket.alumniIntakeId ||
        ticket.alumniIntakeId !== claims.intakeId
      ) {
        res.status(404).json(new ApiError(404, "Ticket not found"));
        return;
      }

      const result = await submitAlumniTicket({
        ticketId: ticket.id,
        intakeId: ticket.alumniIntakeId,
      });

      res.status(200).json(
        new ApiResponse(200, "SUCCESS", result, "Service request submitted"),
      );
      return;
    }

    // --- STUDENT path: verifyJWT has populated req.user ---
    const user = req.user as User | undefined;
    if (!user) {
      res.status(401).json(new ApiError(401, "Unauthorized"));
      return;
    }

    // Resolve the working ticket: either an existing student DRAFT (created via
    // POST /student/draft) or create one inline from serviceTypeId.
    let workingTicketId: number;
    if (bodyTicketId) {
      const existing = await findTicketById(Number(bodyTicketId));
      if (!existing || existing.studentUserId !== (user.id as number)) {
        res.status(404).json(new ApiError(404, "Draft ticket not found"));
        return;
      }
      workingTicketId = existing.id;
    } else {
      if (!serviceTypeId) {
        res.status(400).json(new ApiError(400, "serviceTypeId is required"));
        return;
      }
      const ticket = await createTicket({
        requestorType: "STUDENT",
        studentUserId: user.id as number,
        serviceTypeId: Number(serviceTypeId),
        contactEmail: user.email ?? undefined,
        contactPhone: user.phone ?? undefined,
        details,
      });
      workingTicketId = ticket.id;
    }

    // Students don't need OTP — contactVerified can be set directly
    await db
      .update(serviceTicketsModel)
      .set({ contactVerified: true })
      .where(eq(serviceTicketsModel.id, workingTicketId));

    // DRAFT → SUBMITTED
    await transition(workingTicketId, "SUBMITTED", { userId: user.id as number }, { eventType: "SUBMITTED" });

    // Auto-route SUBMITTED → ROUTED
    await routeTicket(workingTicketId);

    const [updated] = await db
      .select({ referenceId: serviceTicketsModel.referenceId })
      .from(serviceTicketsModel)
      .where(eq(serviceTicketsModel.id, workingTicketId));

    res.status(201).json(
      new ApiResponse(201, "CREATED", {
        ticketId: workingTicketId,
        referenceId: updated.referenceId,
      }, "Service request submitted successfully"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// GET /tickets/:ref
//
// Public tracking endpoint — returns ticket summary by reference ID.
// ---------------------------------------------------------------------------

export const getTicketByRef = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const ref = String(req.params.ref);

    const ticket = await findTicketByRef(ref);
    if (!ticket) {
      res.status(404).json(new ApiError(404, "Ticket not found"));
      return;
    }

    // Look up the service type name for display.
    const [serviceType] = await db
      .select({ name: serviceTypeRoutingModel.name, code: serviceTypeRoutingModel.code })
      .from(serviceTypeRoutingModel)
      .where(eq(serviceTypeRoutingModel.id, ticket.serviceTypeId));

    // Return a safe subset (don't expose internal IDs to unauthenticated callers)
    res.status(200).json(
      new ApiResponse(200, "SUCCESS", {
        referenceId: ticket.referenceId,
        status: ticket.status,
        requestorType: ticket.requestorType,
        serviceType: serviceType
          ? { name: serviceType.name, code: serviceType.code }
          : null,
        slaDueAt: ticket.slaDueAt,
        requiresPhysicalPresence: ticket.requiresPhysicalPresence,
        routedAt: ticket.routedAt,
        approvedAt: ticket.approvedAt,
        closedAt: ticket.closedAt,
        rejectionReason: ticket.rejectionReason,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      }, "Ticket found"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// GET /queue   (clerk)
//
// Returns tickets for the caller's department, filtered by status.
// Query: ?status=ROUTED&page=1&limit=20
// ---------------------------------------------------------------------------

export const getQueue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as User & { departmentId?: number };
    const { status, departmentId: qDeptId, page = "1", limit = "20" } = req.query as Record<string, string>;

    // Admins can pass departmentId; clerks are scoped to their department
    const deptId = qDeptId
      ? Number(qDeptId)
      : (user as any).departmentId ?? null;

    const offset = (Number(page) - 1) * Number(limit);

    // Build dynamic where clause
    const conditions: Parameters<typeof and>[] = [];

    if (deptId) {
      conditions.push(eq(serviceTicketsModel.departmentId, deptId) as any);
    }

    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      if (statuses.length === 1) {
        conditions.push(eq(serviceTicketsModel.status, statuses[0] as any) as any);
      } else {
        conditions.push(inArray(serviceTicketsModel.status, statuses as any[]) as any);
      }
    } else {
      // Default: show actionable statuses
      conditions.push(
        inArray(serviceTicketsModel.status, [
          "ROUTED",
          "UNDER_REVIEW",
          "APPROVED",
          "PENDING_SLOT_BOOKING",
          "SLOT_BOOKED",
        ] as any[]) as any,
      );
    }

    const where = conditions.length > 0 ? and(...(conditions as any[])) : undefined;

    const rows = await db
      .select({
        ticket: serviceTicketsModel,
        serviceTypeName: serviceTypeRoutingModel.name,
        serviceTypeCode: serviceTypeRoutingModel.code,
      })
      .from(serviceTicketsModel)
      .leftJoin(
        serviceTypeRoutingModel,
        eq(serviceTypeRoutingModel.id, serviceTicketsModel.serviceTypeId),
      )
      .where(where)
      .orderBy(serviceTicketsModel.slaDueAt)
      .limit(Number(limit))
      .offset(offset);

    const tickets = rows.map((r) => ({
      ...r.ticket,
      serviceTypeName: r.serviceTypeName,
      serviceTypeCode: r.serviceTypeCode,
    }));

    // Return a shape the admin console can paginate.
    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        { tickets, total: tickets.length, page: Number(page), limit: Number(limit) },
        "Queue fetched",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /tickets/:id/review   (clerk)
//
// Transitions ROUTED → UNDER_REVIEW
// ---------------------------------------------------------------------------

export const startReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as User;
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json(new ApiError(400, "Invalid ticket ID"));
      return;
    }

    const updated = await transition(
      ticketId,
      "UNDER_REVIEW",
      { userId: user.id as number },
      { eventType: "REVIEW_STARTED" },
    );

    res.status(200).json(
      new ApiResponse(200, "UPDATED", updated, "Ticket moved to UNDER_REVIEW"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /tickets/:id/approve   (clerk)
//
// Transitions UNDER_REVIEW → APPROVED
// Requires idProofVerified for alumni (enforced by ticket.service.transition)
// ---------------------------------------------------------------------------

export const approveTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as User;
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json(new ApiError(400, "Invalid ticket ID"));
      return;
    }

    const updated = await transition(
      ticketId,
      "APPROVED",
      { userId: user.id as number },
      { eventType: "APPROVED" },
    );

    res.status(200).json(
      new ApiResponse(200, "UPDATED", updated, "Ticket approved"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /tickets/:id/reject   (clerk)
//
// Transitions UNDER_REVIEW → REJECTED
// Body: { reason: string }
// ---------------------------------------------------------------------------

export const rejectTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as User;
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json(new ApiError(400, "Invalid ticket ID"));
      return;
    }

    const { reason } = req.body as { reason?: string };
    if (!reason) {
      res.status(400).json(new ApiError(400, "rejectionReason is required"));
      return;
    }

    const updated = await transition(
      ticketId,
      "REJECTED",
      { userId: user.id as number },
      {
        eventType: "REJECTED",
        metadata: { reason },
        ticketPatch: { rejectionReason: reason },
      },
    );

    res.status(200).json(
      new ApiResponse(200, "UPDATED", updated, "Ticket rejected"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /tickets/:id/fulfilment   (clerk)
//
// After APPROVED: decide if physical presence is required.
// Body: { requiresPhysicalPresence: boolean }
//
// If requiresPhysicalPresence = true  → APPROVED → PENDING_SLOT_BOOKING
// If requiresPhysicalPresence = false → APPROVED → FULFILLED
// ---------------------------------------------------------------------------

export const setFulfilment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as User;
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json(new ApiError(400, "Invalid ticket ID"));
      return;
    }

    const { requiresPhysicalPresence } = req.body as { requiresPhysicalPresence?: boolean };
    if (requiresPhysicalPresence === undefined) {
      res.status(400).json(new ApiError(400, "requiresPhysicalPresence (boolean) is required"));
      return;
    }

    const toStatus = requiresPhysicalPresence ? "PENDING_SLOT_BOOKING" : "FULFILLED";

    const updated = await transition(
      ticketId,
      toStatus,
      { userId: user.id as number },
      {
        eventType: requiresPhysicalPresence ? "FULFILLMENT_SET" : "FULFILLED",
        ticketPatch: { requiresPhysicalPresence },
      },
    );

    if (toStatus === "FULFILLED") {
      // Auto-close
      await transition(
        ticketId,
        "CLOSED",
        { userId: user.id as number },
        { eventType: "CLOSED" },
      );
    }

    res.status(200).json(
      new ApiResponse(200, "UPDATED", updated, `Fulfilment decision set: ${toStatus}`),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// GET /service-types
//
// Returns all active service types (used by frontend forms).
// ---------------------------------------------------------------------------

export const getServiceTypes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const serviceTypes = await listServiceTypes();
    res.status(200).json(
      new ApiResponse(200, "SUCCESS", serviceTypes, "Service types fetched"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// GET /tickets/:id/events  (clerk)
//
// Returns the audit event trail for a ticket.
// ---------------------------------------------------------------------------

export const getTicketEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json(new ApiError(400, "Invalid ticket ID"));
      return;
    }

    const events = await db
      .select()
      .from(serviceTicketEventsModel)
      .where(eq(serviceTicketEventsModel.ticketId, ticketId))
      .orderBy(serviceTicketEventsModel.createdAt);

    res.status(200).json(
      new ApiResponse(200, "SUCCESS", events, "Ticket events fetched"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// GET /tickets/:id  (clerk)
//
// Returns full ticket detail including linked intake (if alumni).
// ---------------------------------------------------------------------------

export const getTicketDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json(new ApiError(400, "Invalid ticket ID"));
      return;
    }

    const ticket = await findTicketById(ticketId);
    if (!ticket) {
      res.status(404).json(new ApiError(404, "Ticket not found"));
      return;
    }

    // Fetch linked alumni intake if present
    let alumniIntake = null;
    if (ticket.alumniIntakeId) {
      const [intake] = await db
        .select()
        .from(serviceAlumniIntakeModel)
        .where(eq(serviceAlumniIntakeModel.id, ticket.alumniIntakeId));
      // Strip S3 key from response (serve via signed URL endpoint)
      if (intake) {
        const { idProofS3Key: _s3Key, ...safeIntake } = intake;
        alumniIntake = safeIntake;
      }
    }

    // Fetch service type details
    const [serviceType] = await db
      .select()
      .from(serviceTypeRoutingModel)
      .where(eq(serviceTypeRoutingModel.id, ticket.serviceTypeId));

    res.status(200).json(
      new ApiResponse(200, "SUCCESS", { ticket, alumniIntake, serviceType }, "Ticket detail fetched"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /student/draft   (student, verifyJWT)
//
// Convenience endpoint for the student console: creates a DRAFT ticket bound
// to the authenticated student. The console then calls POST /submit with the
// returned ticketId to submit + auto-route.
// Body: { serviceTypeId, details? }
// ---------------------------------------------------------------------------

export const createStudentDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as User | undefined;
    if (!user) {
      res.status(401).json(new ApiError(401, "Unauthorized"));
      return;
    }

    const { serviceTypeId, details } = req.body as {
      serviceTypeId?: number;
      details?: Record<string, unknown>;
    };
    if (!serviceTypeId) {
      res.status(400).json(new ApiError(400, "serviceTypeId is required"));
      return;
    }

    const ticket = await createTicket({
      requestorType: "STUDENT",
      studentUserId: user.id as number,
      serviceTypeId: Number(serviceTypeId),
      contactEmail: user.email ?? undefined,
      contactPhone: user.phone ?? undefined,
      details,
    });

    res.status(201).json(
      new ApiResponse(201, "CREATED", {
        ticketId: ticket.id,
        referenceId: ticket.referenceId,
      }, "Draft ticket created"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// GET /my-tickets   (student, verifyJWT)
//
// Returns the authenticated student's own tickets (scoped by studentUserId),
// newest first. Distinct from /queue, which is the department clerk view.
// ---------------------------------------------------------------------------

export const getMyTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as User | undefined;
    if (!user) {
      res.status(401).json(new ApiError(401, "Unauthorized"));
      return;
    }

    const rows = await db
      .select({
        ticket: serviceTicketsModel,
        serviceTypeName: serviceTypeRoutingModel.name,
        serviceTypeCode: serviceTypeRoutingModel.code,
      })
      .from(serviceTicketsModel)
      .leftJoin(
        serviceTypeRoutingModel,
        eq(serviceTypeRoutingModel.id, serviceTicketsModel.serviceTypeId),
      )
      .where(eq(serviceTicketsModel.studentUserId, user.id as number))
      .orderBy(desc(serviceTicketsModel.createdAt));

    const tickets = rows.map((r) => ({
      ...r.ticket,
      serviceType: r.serviceTypeName
        ? { name: r.serviceTypeName, code: r.serviceTypeCode }
        : null,
    }));

    res.status(200).json(
      new ApiResponse(200, "SUCCESS", tickets, "My tickets fetched"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};
