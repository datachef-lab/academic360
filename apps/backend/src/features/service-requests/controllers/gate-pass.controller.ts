import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import { User } from "@repo/db/schemas/models/user";
import {
  scanGatePass,
  issueBypassPass,
  getActiveGatePassForTicket,
} from "../services/gate-pass.service.js";
import { findTicketById } from "../services/ticket.service.js";
import { canAccessTicket } from "../authz.js";

// ---------------------------------------------------------------------------
// POST /gate/scan   (guard role — verifyJWT applied in router)
//
// Body: { nonce: string }
// Returns GREEN or RED with reason.
// ---------------------------------------------------------------------------

export const scan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as User;
    const { nonce } = req.body as { nonce?: string };

    if (!nonce) {
      res.status(400).json(new ApiError(400, "nonce is required"));
      return;
    }

    const result = await scanGatePass(nonce, user.id as number);

    if (result.status === "GREEN") {
      res.status(200).json(
        new ApiResponse(200, "GREEN", {
          gatePassId: result.gatePassId,
          ticketId: result.ticketId,
          payload: result.payload,
        }, "Access granted — check-in recorded"),
      );
    } else {
      res.status(200).json(
        new ApiResponse(200, "RED", { reason: result.reason }, `Access denied: ${result.reason}`),
      );
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /gate/bypass   (admin/clerk — verifyJWT applied in router)
//
// Issues a bypass gate pass (override path).
// Body: { ticketId: number, validMinutes?: number }
// ---------------------------------------------------------------------------

export const issueBypass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as User;
    const { ticketId, validMinutes = 60 } = req.body as {
      ticketId?: number;
      validMinutes?: number;
    };

    if (!ticketId) {
      res.status(400).json(new ApiError(400, "ticketId is required"));
      return;
    }

    const bypassPass = await issueBypassPass(
      Number(ticketId),
      user.id as number,
      Number(validMinutes),
    );

    res.status(201).json(
      new ApiResponse(201, "CREATED", bypassPass, "Bypass gate pass issued"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// GET /gate/tickets/:ticketId/pass
//
// Returns the active gate pass + QR data URL for a ticket.
// ---------------------------------------------------------------------------

export const getPass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const ticketId = Number(req.params.ticketId);
    if (isNaN(ticketId)) {
      res.status(400).json(new ApiError(400, "Invalid ticket ID"));
      return;
    }

    // Authorize: staff OR the owning student may retrieve the pass.
    const ticket = await findTicketById(ticketId);
    if (!ticket) {
      res.status(404).json(new ApiError(404, "Ticket not found"));
      return;
    }
    if (!canAccessTicket(req.user as User | undefined, ticket)) {
      res.status(403).json(new ApiError(403, "Forbidden"));
      return;
    }

    const gatePass = await getActiveGatePassForTicket(ticketId);

    if (!gatePass) {
      res.status(404).json(new ApiError(404, "No active gate pass found for this ticket"));
      return;
    }

    // Strip the nonce from the response — only the QR data URL (which encodes the nonce URL) is returned
    const { nonce: _nonce, ...safePass } = gatePass;

    res.status(200).json(
      new ApiResponse(200, "SUCCESS", safePass, "Gate pass fetched"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};
