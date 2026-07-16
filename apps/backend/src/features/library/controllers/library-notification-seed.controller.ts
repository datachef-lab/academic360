import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { seedLibraryNotificationTemplates } from "@/features/library/services/library-notification-seed.service.js";

export const seedLibraryNotifications = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const r = await seedLibraryNotificationTemplates();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          r,
          `Seeded ${r.inserted} library notification templates (${r.skipped} already existed).`,
        ),
      );
  } catch (e) {
    handleError(e, res, next);
  }
};
