import { NextFunction, Request, Response } from "express";

import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import { resolveStudentAvatar } from "@/features/user/services/student-avatar.service.js";

export const getStudentAvatarController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = String(req.params.uid ?? "").trim();
    if (!uid) throw new ApiError(400, "uid is required.");
    const hit = await resolveStudentAvatar(uid);
    if (!hit) {
      // Client renders initials on any non-2xx.
      res.status(404).end();
      return;
    }
    res.setHeader("Content-Type", hit.contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("X-Avatar-Source", hit.source);
    res.setHeader("X-Avatar-Uid-Used", hit.uidUsed);
    res.send(hit.buffer);
  } catch (e) {
    handleError(e, res, next);
  }
};
