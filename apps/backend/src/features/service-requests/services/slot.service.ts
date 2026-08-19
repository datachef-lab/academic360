import { db } from "@/db/index.js";
import { serviceSlotInstancesModel } from "@repo/db/schemas/models/service-requests/service-slot-instances.model.js";
import { serviceSlotBookingsModel } from "@repo/db/schemas/models/service-requests/service-slot-bookings.model.js";
import { departmentSlotWindowsModel } from "@repo/db/schemas/models/service-requests/department-slot-windows.model.js";
import { serviceTicketsModel } from "@repo/db/schemas/models/service-requests/service-tickets.model.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { transition } from "./ticket.service.js";

// ---------------------------------------------------------------------------
// Institution timezone (pinned — all slot math uses Asia/Kolkata)
// ---------------------------------------------------------------------------

const INSTITUTION_TZ = "Asia/Kolkata";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the weekday string (MON..SUN) for a given Date in the institution TZ.
 */
function getWeekdayForDate(date: Date): string {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayIndex = new Date(
    date.toLocaleString("en-US", { timeZone: INSTITUTION_TZ }),
  ).getDay();
  return days[dayIndex];
}

/**
 * Combines a `slotDate` (YYYY-MM-DD string) with a `time` string (HH:MM:SS)
 * to produce an absolute UTC timestamp anchored in Asia/Kolkata.
 */
function buildTimestamp(slotDate: string, timeStr: string): Date {
  // timeStr from PG `time` column is "HH:MM:SS"
  const localIso = `${slotDate}T${timeStr}+05:30`;
  return new Date(localIso);
}

// ---------------------------------------------------------------------------
// materializeSlotInstances
//
// Lazy-create slot instances for a given department + date range via
// INSERT ... ON CONFLICT DO NOTHING (idempotent).
// ---------------------------------------------------------------------------

export async function materializeSlotInstances(
  departmentId: number,
  dateStr: string, // "YYYY-MM-DD"
): Promise<void> {
  const weekday = getWeekdayForDate(new Date(`${dateStr}T00:00:00+05:30`));

  const windows = await db
    .select()
    .from(departmentSlotWindowsModel)
    .where(
      and(
        eq(departmentSlotWindowsModel.departmentId, departmentId),
        eq(departmentSlotWindowsModel.weekday, weekday as any),
        eq(departmentSlotWindowsModel.isActive, true),
      ),
    );

  for (const win of windows) {
    // Check effectiveFrom / effectiveTo
    if (win.effectiveFrom && dateStr < win.effectiveFrom) continue;
    if (win.effectiveTo && dateStr > win.effectiveTo) continue;

    const startAt = buildTimestamp(dateStr, win.startTime);
    const endAt = buildTimestamp(dateStr, win.endTime);

    await db
      .insert(serviceSlotInstancesModel)
      .values({
        departmentId,
        slotWindowId: win.id,
        slotDate: dateStr,
        startAt,
        endAt,
        capacity: win.capacityPerSlot,
        bookedCount: 0,
      })
      .onConflictDoNothing(); // unique(departmentId, slotDate, startAt)
  }
}

// ---------------------------------------------------------------------------
// getAvailableSlots  (with lazy materialization)
// ---------------------------------------------------------------------------

export interface SlotAvailability {
  slotInstanceId: number;
  slotDate: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
  bookedCount: number;
  available: number;
}

export async function getAvailableSlots(
  departmentId: number,
  dateStr: string,
): Promise<SlotAvailability[]> {
  // Materialize first (idempotent)
  await materializeSlotInstances(departmentId, dateStr);

  const dayStart = new Date(`${dateStr}T00:00:00+05:30`);
  const dayEnd = new Date(`${dateStr}T23:59:59+05:30`);

  const instances = await db
    .select()
    .from(serviceSlotInstancesModel)
    .where(
      and(
        eq(serviceSlotInstancesModel.departmentId, departmentId),
        gte(serviceSlotInstancesModel.startAt, dayStart),
        lte(serviceSlotInstancesModel.startAt, dayEnd),
      ),
    );

  return instances.map((inst) => ({
    slotInstanceId: inst.id,
    slotDate: inst.slotDate,
    startAt: inst.startAt,
    endAt: inst.endAt,
    capacity: inst.capacity,
    bookedCount: inst.bookedCount,
    available: inst.capacity - inst.bookedCount,
  }));
}

// ---------------------------------------------------------------------------
// bookSlot  — ATOMIC booking (capacity-safe)
// ---------------------------------------------------------------------------

/**
 * Atomically:
 *   1. Increments bookedCount WHERE bookedCount < capacity (409 if full)
 *   2. Inserts the slot booking row
 *   3. Transitions ticket PENDING_SLOT_BOOKING → SLOT_BOOKED
 *   4. Issues a gate pass (delegated to gate-pass.service)
 *
 * All inside one db.transaction — any failure rolls everything back.
 */
export async function bookSlot(
  ticketId: number,
  slotInstanceId: number,
): Promise<{
  booking: typeof serviceSlotBookingsModel.$inferSelect;
  gatePass: Awaited<ReturnType<typeof import("./gate-pass.service.js").issueGatePass>>;
}> {
  return db.transaction(async (tx) => {
    // ATOMIC conditional increment — returns the row if capacity available
    const result = await tx.execute(
      sql`
        UPDATE service_slot_instances
           SET booked_count = booked_count + 1,
               updated_at   = now()
         WHERE id = ${slotInstanceId}
           AND booked_count < capacity
        RETURNING id, capacity, booked_count
      `,
    );

    if (!result.rows.length) {
      throw new ApiError(409, "This slot is fully booked. Please choose another slot.");
    }

    // Insert the booking
    const [booking] = await tx
      .insert(serviceSlotBookingsModel)
      .values({
        ticketId,
        slotInstanceId,
        status: "BOOKED",
        bookedAt: new Date(),
      })
      .returning();

    // Transition ticket PENDING_SLOT_BOOKING → SLOT_BOOKED.
    // Thread `tx` so it runs on THIS connection (no cross-connection deadlock).
    await transition(ticketId, "SLOT_BOOKED", {}, {
      eventType: "SLOT_BOOKED",
      metadata: { slotInstanceId, bookingId: booking.id },
    }, tx);

    // Fetch slot instance details needed for gate pass
    const [slotInst] = await tx
      .select()
      .from(serviceSlotInstancesModel)
      .where(eq(serviceSlotInstancesModel.id, slotInstanceId));

    const [ticket] = await tx
      .select()
      .from(serviceTicketsModel)
      .where(eq(serviceTicketsModel.id, ticketId));

    // Issue gate pass (runs inside the same transaction scope by passing tx)
    const { issueGatePass } = await import("./gate-pass.service.js");
    const gatePass = await issueGatePass({
      ticketId,
      slotBookingId: booking.id,
      slotInst,
      ticket,
      tx,
    });

    return { booking, gatePass };
  });
}

// ---------------------------------------------------------------------------
// cancelSlotBooking  — decrement guarded by bookedCount > 0
// ---------------------------------------------------------------------------

export async function cancelSlotBooking(
  bookingId: number,
  ticketId: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(serviceSlotBookingsModel)
      .where(eq(serviceSlotBookingsModel.id, bookingId))
      .for("update");

    if (!booking) throw new ApiError(404, `Booking ${bookingId} not found`);
    if (booking.ticketId !== ticketId) throw new ApiError(403, "Booking does not belong to this ticket");
    if (booking.status === "CANCELLED") throw new ApiError(409, "Booking is already cancelled");
    if (booking.status === "CHECKED_IN") throw new ApiError(409, "Cannot cancel a checked-in booking");

    // Decrement guarded
    await tx.execute(
      sql`
        UPDATE service_slot_instances
           SET booked_count = GREATEST(0, booked_count - 1),
               updated_at   = now()
         WHERE id = ${booking.slotInstanceId}
           AND booked_count > 0
      `,
    );

    await tx
      .update(serviceSlotBookingsModel)
      .set({ status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(serviceSlotBookingsModel.id, bookingId));

    // Revoke active gate pass(es) for this booking
    const { revokeGatePassForBooking } = await import("./gate-pass.service.js");
    await revokeGatePassForBooking(booking.id, tx);

    // Transition ticket → CANCELLED (on this tx to avoid cross-connection deadlock)
    await transition(ticketId, "CANCELLED", {}, { eventType: "CANCELLED" }, tx);
  });
}

// ---------------------------------------------------------------------------
// rescheduleSlotBooking
// — decrement old + increment new + new gate pass in one txn
// ---------------------------------------------------------------------------

export async function rescheduleSlotBooking(
  bookingId: number,
  ticketId: number,
  newSlotInstanceId: number,
): Promise<{
  booking: typeof serviceSlotBookingsModel.$inferSelect;
}> {
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(serviceSlotBookingsModel)
      .where(eq(serviceSlotBookingsModel.id, bookingId))
      .for("update");

    if (!booking) throw new ApiError(404, `Booking ${bookingId} not found`);
    if (booking.ticketId !== ticketId) throw new ApiError(403, "Booking does not belong to this ticket");
    if (!["BOOKED"].includes(booking.status)) {
      throw new ApiError(409, `Cannot reschedule booking in status '${booking.status}'`);
    }

    // Decrement old slot
    await tx.execute(
      sql`
        UPDATE service_slot_instances
           SET booked_count = GREATEST(0, booked_count - 1),
               updated_at   = now()
         WHERE id = ${booking.slotInstanceId}
           AND booked_count > 0
      `,
    );

    // Increment new slot atomically
    const newSlotResult = await tx.execute(
      sql`
        UPDATE service_slot_instances
           SET booked_count = booked_count + 1,
               updated_at   = now()
         WHERE id = ${newSlotInstanceId}
           AND booked_count < capacity
        RETURNING id
      `,
    );

    if (!newSlotResult.rows.length) {
      throw new ApiError(409, "The new slot is fully booked. Please choose another slot.");
    }

    // Mark old booking RESCHEDULED
    await tx
      .update(serviceSlotBookingsModel)
      .set({ status: "RESCHEDULED", updatedAt: new Date() })
      .where(eq(serviceSlotBookingsModel.id, bookingId));

    // Insert new booking
    const [newBooking] = await tx
      .insert(serviceSlotBookingsModel)
      .values({
        ticketId,
        slotInstanceId: newSlotInstanceId,
        status: "BOOKED",
        bookedAt: new Date(),
      })
      .returning();

    // Revoke old gate pass and issue new one
    const { revokeGatePassForBooking, issueGatePass } = await import("./gate-pass.service.js");
    await revokeGatePassForBooking(booking.id, tx);

    const [newSlotInst] = await tx
      .select()
      .from(serviceSlotInstancesModel)
      .where(eq(serviceSlotInstancesModel.id, newSlotInstanceId));

    const [ticket] = await tx
      .select()
      .from(serviceTicketsModel)
      .where(eq(serviceTicketsModel.id, ticketId));

    await issueGatePass({
      ticketId,
      slotBookingId: newBooking.id,
      slotInst: newSlotInst,
      ticket,
      tx,
    });

    // Append reschedule event
    const { serviceTicketEventsModel } = await import(
      "@repo/db/schemas/models/service-requests/service-ticket-events.model.js"
    );
    await tx.insert(serviceTicketEventsModel).values({
      ticketId,
      eventType: "SLOT_RESCHEDULED",
      fromStatus: null,
      toStatus: null,
      actorUserId: null,
      metadata: {
        oldBookingId: bookingId,
        newBookingId: newBooking.id,
        newSlotInstanceId,
      } as any,
    });

    return { booking: newBooking };
  });
}
