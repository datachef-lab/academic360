import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  closeCdlSession,
  startCdlSession,
} from "@/features/library/services/cdl.service.js";

const actorUserId = (req: Request): number | null => {
  const u = req.user as { id?: number } | undefined;
  return typeof u?.id === "number" ? u.id : null;
};

export const startCdlSessionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookId = Number(req.params.bookId);
    if (!bookId || Number.isNaN(bookId))
      throw new ApiError(400, "Invalid book id.");
    const userId = actorUserId(req);
    if (userId == null) throw new ApiError(401, "Unauthorized.");
    const result = await startCdlSession(bookId, userId);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "CDL session started."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const closeCdlSessionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId = Number(req.params.sessionId);
    if (!sessionId || Number.isNaN(sessionId))
      throw new ApiError(400, "Invalid session id.");
    const userId = actorUserId(req);
    if (userId == null) throw new ApiError(401, "Unauthorized.");
    await closeCdlSession(sessionId, userId);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Session closed."));
  } catch (e) {
    handleError(e, res, next);
  }
};

// Backwards-compatible name used by an older route entry.
export const requestCdlAccess = startCdlSessionController;
