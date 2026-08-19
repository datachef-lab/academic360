import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import { User } from "@repo/db/schemas/models/user";
import { db } from "@/db/index.js";
import { eq, and } from "drizzle-orm";
import { departmentSlotWindowsModel } from "@repo/db/schemas/models/service-requests/department-slot-windows.model.js";
import {
  getAvailableSlots,
  bookSlot,
  cancelSlotBooking,
  rescheduleSlotBooking,
} from "../services/slot.service.js";
import { findTicketById } from "../services/ticket.service.js";
import { canAccessTicket } from "../authz.js";

/**
 * Loads the ticket named by :id and asserts the caller may act on it
 * (owning student OR staff). Writes the error response and returns null
 * when validation/authorization fails.
 */
async function authorizeTicketAction(
  req: Request,
  res: Response,
): Promise<{ id: number } | null> {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) {
    res.status(400).json(new ApiError(400, "Invalid ticket ID"));
    return null;
  }
  const ticket = await findTicketById(ticketId);
  if (!ticket) {
    res.status(404).json(new ApiError(404, "Ticket not found"));
    return null;
  }
  if (!canAccessTicket(req.user as User | undefined, ticket)) {
    res.status(403).json(new ApiError(403, "Forbidden"));
    return null;
  }
  return ticket;
}

// ---------------------------------------------------------------------------
// GET /departments/:id/slots?date=YYYY-MM-DD
//
// Returns materialized slot availability for a department on a given date.
// ---------------------------------------------------------------------------

export const getSlots = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const departmentId = Number(req.params.id);
    if (isNaN(departmentId)) {
      res.status(400).json(new ApiError(400, "Invalid department ID"));
      return;
    }

    const { date } = req.query as { date?: string };
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json(new ApiError(400, "date query param is required (format: YYYY-MM-DD)"));
      return;
    }

    const slots = await getAvailableSlots(departmentId, date);

    res.status(200).json(
      new ApiResponse(200, "SUCCESS", slots, "Slot availability fetched"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /tickets/:id/book
//
// Books a slot for a ticket (PENDING_SLOT_BOOKING → SLOT_BOOKED).
// Body: { slotInstanceId: number }
// ---------------------------------------------------------------------------

export const bookTicketSlot = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const ticket = await authorizeTicketAction(req, res);
    if (!ticket) return;
    const ticketId = ticket.id;

    const { slotInstanceId } = req.body as { slotInstanceId?: number };
    if (!slotInstanceId) {
      res.status(400).json(new ApiError(400, "slotInstanceId is required"));
      return;
    }

    const result = await bookSlot(ticketId, Number(slotInstanceId));

    res.status(201).json(
      new ApiResponse(201, "CREATED", {
        booking: result.booking,
        gatePassId: result.gatePass.id,
        gatePassStatus: result.gatePass.status,
        validFrom: result.gatePass.validFrom,
        validUntil: result.gatePass.validUntil,
      }, "Slot booked and gate pass issued"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /tickets/:id/cancel-booking
//
// Cancels the active slot booking for a ticket.
// Body: { bookingId: number }
// ---------------------------------------------------------------------------

export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const ticket = await authorizeTicketAction(req, res);
    if (!ticket) return;
    const ticketId = ticket.id;

    const { bookingId } = req.body as { bookingId?: number };
    if (!bookingId) {
      res.status(400).json(new ApiError(400, "bookingId is required"));
      return;
    }

    await cancelSlotBooking(Number(bookingId), ticketId);

    res.status(200).json(
      new ApiResponse(200, "UPDATED", null, "Booking cancelled and ticket moved to CANCELLED"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /tickets/:id/reschedule
//
// Reschedules the slot booking to a new slot instance.
// Body: { bookingId: number, newSlotInstanceId: number }
// ---------------------------------------------------------------------------

export const rescheduleBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const ticket = await authorizeTicketAction(req, res);
    if (!ticket) return;
    const ticketId = ticket.id;

    const { bookingId, newSlotInstanceId } = req.body as {
      bookingId?: number;
      newSlotInstanceId?: number;
    };

    if (!bookingId || !newSlotInstanceId) {
      res.status(400).json(new ApiError(400, "bookingId and newSlotInstanceId are required"));
      return;
    }

    const result = await rescheduleSlotBooking(
      Number(bookingId),
      ticketId,
      Number(newSlotInstanceId),
    );

    res.status(200).json(
      new ApiResponse(200, "UPDATED", result, "Booking rescheduled and new gate pass issued"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// Slot-Window Admin CRUD
// ---------------------------------------------------------------------------

// GET /departments/:id/slot-windows
export const listSlotWindows = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const departmentId = Number(req.params.id);
    if (isNaN(departmentId)) {
      res.status(400).json(new ApiError(400, "Invalid department ID"));
      return;
    }

    const windows = await db
      .select()
      .from(departmentSlotWindowsModel)
      .where(eq(departmentSlotWindowsModel.departmentId, departmentId))
      .orderBy(departmentSlotWindowsModel.weekday, departmentSlotWindowsModel.startTime);

    res.status(200).json(
      new ApiResponse(200, "SUCCESS", windows, "Slot windows fetched"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// POST /departments/:id/slot-windows
export const createSlotWindow = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const departmentId = Number(req.params.id);
    if (isNaN(departmentId)) {
      res.status(400).json(new ApiError(400, "Invalid department ID"));
      return;
    }

    const { weekday, startTime, endTime, slotDurationMinutes, capacityPerSlot, isActive, effectiveFrom, effectiveTo } =
      req.body as {
        weekday?: string;
        startTime?: string;
        endTime?: string;
        slotDurationMinutes?: number;
        capacityPerSlot?: number;
        isActive?: boolean;
        effectiveFrom?: string;
        effectiveTo?: string;
      };

    if (!weekday || !startTime || !endTime || !capacityPerSlot) {
      res.status(400).json(new ApiError(400, "weekday, startTime, endTime, and capacityPerSlot are required"));
      return;
    }

    const [created] = await db
      .insert(departmentSlotWindowsModel)
      .values({
        departmentId,
        weekday: weekday as any,
        startTime,
        endTime,
        slotDurationMinutes: slotDurationMinutes ?? 60,
        capacityPerSlot: Number(capacityPerSlot),
        isActive: isActive ?? true,
        effectiveFrom: effectiveFrom ?? null,
        effectiveTo: effectiveTo ?? null,
      })
      .returning();

    res.status(201).json(
      new ApiResponse(201, "CREATED", created, "Slot window created"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// PUT /departments/:id/slot-windows/:windowId
export const updateSlotWindow = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const departmentId = Number(req.params.id);
    const windowId = Number(req.params.windowId);
    if (isNaN(departmentId) || isNaN(windowId)) {
      res.status(400).json(new ApiError(400, "Invalid ID"));
      return;
    }

    const patch = req.body as Partial<{
      weekday: string;
      startTime: string;
      endTime: string;
      slotDurationMinutes: number;
      capacityPerSlot: number;
      isActive: boolean;
      effectiveFrom: string;
      effectiveTo: string;
    }>;

    // Whitelist only the mutable columns. Spreading the raw body here would let a
    // caller overwrite id / departmentId / createdAt (mass assignment).
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.weekday !== undefined) updates.weekday = patch.weekday;
    if (patch.startTime !== undefined) updates.startTime = patch.startTime;
    if (patch.endTime !== undefined) updates.endTime = patch.endTime;
    if (patch.slotDurationMinutes !== undefined)
      updates.slotDurationMinutes = patch.slotDurationMinutes;
    if (patch.capacityPerSlot !== undefined)
      updates.capacityPerSlot = patch.capacityPerSlot;
    if (patch.isActive !== undefined) updates.isActive = patch.isActive;
    if (patch.effectiveFrom !== undefined)
      updates.effectiveFrom = patch.effectiveFrom;
    if (patch.effectiveTo !== undefined) updates.effectiveTo = patch.effectiveTo;

    const [updated] = await db
      .update(departmentSlotWindowsModel)
      .set(updates as any)
      .where(
        and(
          eq(departmentSlotWindowsModel.id, windowId),
          eq(departmentSlotWindowsModel.departmentId, departmentId),
        ),
      )
      .returning();

    if (!updated) {
      res.status(404).json(new ApiError(404, "Slot window not found"));
      return;
    }

    res.status(200).json(
      new ApiResponse(200, "UPDATED", updated, "Slot window updated"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// DELETE /departments/:id/slot-windows/:windowId
export const deleteSlotWindow = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const departmentId = Number(req.params.id);
    const windowId = Number(req.params.windowId);
    if (isNaN(departmentId) || isNaN(windowId)) {
      res.status(400).json(new ApiError(400, "Invalid ID"));
      return;
    }

    const [deleted] = await db
      .delete(departmentSlotWindowsModel)
      .where(
        and(
          eq(departmentSlotWindowsModel.id, windowId),
          eq(departmentSlotWindowsModel.departmentId, departmentId),
        ),
      )
      .returning();

    if (!deleted) {
      res.status(404).json(new ApiError(404, "Slot window not found"));
      return;
    }

    res.status(200).json(
      new ApiResponse(200, "DELETED", null, "Slot window deleted"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};
