import { db } from "@/db/index.js";
import { serviceTypeRoutingModel } from "@repo/db/schemas/models/service-requests/service-type-routing.model.js";
import { serviceAlumniIntakeModel } from "@repo/db/schemas/models/service-requests/service-alumni-intake.model.js";
import { departmentModel } from "@repo/db/schemas/models/administration/department.model.js";
import { serviceTicketsModel } from "@repo/db/schemas/models/service-requests/service-tickets.model.js";
import { eq, ilike } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { transition } from "./ticket.service.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoutingResult {
  serviceType: typeof serviceTypeRoutingModel.$inferSelect;
  departmentId: number | null;
  slaDueAt: Date;
  requiresPhysicalPresence: boolean;
}

// ---------------------------------------------------------------------------
// lookupServiceType
// ---------------------------------------------------------------------------

export async function lookupServiceType(
  serviceTypeId: number,
): Promise<typeof serviceTypeRoutingModel.$inferSelect | null> {
  const [serviceType] = await db
    .select()
    .from(serviceTypeRoutingModel)
    .where(eq(serviceTypeRoutingModel.id, serviceTypeId));
  return serviceType ?? null;
}

export async function lookupServiceTypeByCode(
  code: string,
): Promise<typeof serviceTypeRoutingModel.$inferSelect | null> {
  const [serviceType] = await db
    .select()
    .from(serviceTypeRoutingModel)
    .where(eq(serviceTypeRoutingModel.code, code));
  return serviceType ?? null;
}

// ---------------------------------------------------------------------------
// resolveHodDepartment
//
// "HOD" service types are not fixed to one department — they route to the
// requestor's academic department based on their course/stream.
// ---------------------------------------------------------------------------

/**
 * Resolves the correct department for HOD-type routing.
 *
 * For alumni, the department is derived from `courseStream` (e.g. "B.Com",
 * "B.Sc", "B.A.") by matching against department names.
 * For students, it matches their program/course.
 *
 * Returns null if no department match is found (clerk must manually assign).
 */
async function resolveHodDepartment(
  ticket: typeof serviceTicketsModel.$inferSelect,
): Promise<number | null> {
  let stream: string | null = null;

  if (ticket.requestorType === "ALUMNI" && ticket.alumniIntakeId) {
    const [intake] = await db
      .select({ courseStream: serviceAlumniIntakeModel.courseStream })
      .from(serviceAlumniIntakeModel)
      .where(eq(serviceAlumniIntakeModel.id, ticket.alumniIntakeId));
    stream = intake?.courseStream ?? null;
  } else if (ticket.requestorType === "STUDENT" && ticket.studentUserId) {
    // For students, pull their course/programme from the user record.
    // The userModel stores course info in related tables; as a best-effort
    // approach we search departments by matching keywords from the ticket details.
    const details = ticket.details as Record<string, unknown> | null;
    stream = (details?.courseStream as string) ?? null;
  }

  if (!stream) return null;

  // Normalize: strip parentheses/hyphens and get the first meaningful keyword
  // e.g. "Bachelor of Commerce (Honours)" -> "Commerce"
  const keywords = stream
    .replace(/\(.*?\)/g, "")
    .split(/[\s,/-]+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);

  for (const keyword of keywords) {
    const [dept] = await db
      .select({ id: departmentModel.id })
      .from(departmentModel)
      .where(ilike(departmentModel.name as any, `%${keyword}%`))
      .limit(1);
    if (dept) return dept.id;
  }

  return null;
}

// ---------------------------------------------------------------------------
// routeTicket  — computes departmentId + slaDueAt and transitions SUBMITTED→ROUTED
// ---------------------------------------------------------------------------

/**
 * Called immediately after a ticket is SUBMITTED.
 * Looks up routing config, resolves HOD if needed, computes slaDueAt,
 * and transitions the ticket from SUBMITTED → ROUTED in one DB transaction.
 */
export async function routeTicket(
  ticketId: number,
): Promise<RoutingResult> {
  const [ticket] = await db
    .select()
    .from(serviceTicketsModel)
    .where(eq(serviceTicketsModel.id, ticketId));

  if (!ticket) {
    throw new ApiError(404, `Ticket ${ticketId} not found`);
  }

  const serviceType = await lookupServiceType(ticket.serviceTypeId);
  if (!serviceType) {
    throw new ApiError(500, `Service type ${ticket.serviceTypeId} not found in routing config`);
  }
  if (!serviceType.isActive) {
    throw new ApiError(400, `Service type '${serviceType.name}' is not active`);
  }

  // Determine the target department
  let departmentId: number | null = serviceType.departmentId;

  // HOD routing: departmentId is null in the config → resolve from requestor's stream.
  // If it can't be resolved (e.g. no matching department), route with a null
  // department — the ticket still reaches the queue and a clerk/admin assigns it
  // manually. Do NOT fail submission over an unresolved department.
  if (!departmentId) {
    departmentId = await resolveHodDepartment(ticket);
  }

  // Compute SLA due date (business-day approximation: calendar days)
  const routedAt = new Date();
  const slaDueAt = new Date(routedAt.getTime() + serviceType.slaDays * 24 * 60 * 60 * 1000);

  const requiresPhysicalPresence = serviceType.requiresPhysicalPresenceDefault;

  // Transition SUBMITTED → ROUTED (also writes ticket event)
  await transition(ticketId, "ROUTED", {}, {
    eventType: "ROUTED",
    ticketPatch: {
      departmentId,
      slaDueAt,
      requiresPhysicalPresence,
      routedAt,
    },
  });

  return {
    serviceType,
    departmentId,
    slaDueAt,
    requiresPhysicalPresence,
  };
}

// ---------------------------------------------------------------------------
// listServiceTypes
// ---------------------------------------------------------------------------

export async function listServiceTypes(): Promise<
  (typeof serviceTypeRoutingModel.$inferSelect)[]
> {
  return db
    .select()
    .from(serviceTypeRoutingModel)
    .where(eq(serviceTypeRoutingModel.isActive, true));
}
