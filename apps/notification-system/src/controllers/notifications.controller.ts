import type { Request, Response } from "express";
import { NotificationsService } from "@/services/notifications.service.js";

export class NotificationsController {
  static async enqueue(req: Request, res: Response) {
    try {
      const origin = String(req.headers.origin || "");
      const host = String(req.headers.host || "");
      const env = String(process.env.NODE_ENV || "development");
      const allowedDevOrigins = [
        "http://localhost",
        "https://localhost",
        "http://127.0.0.1",
        "https://127.0.0.1",
        "https://stag.academic360.app",
      ];
      const allowedDevPorts = ["5173", "3000"];
      const isDevOrigin =
        allowedDevOrigins.some((o) => origin.startsWith(o)) ||
        allowedDevPorts.some((p) => host.endsWith(`:${p}`));

      // Environment-based routing:
      // - development: always devOnly
      // - staging: devOnly; workers bypass for STAFF
      // - production: devOnly only if dev origin/host
      const devOnly =
        env === "development"
          ? true
          : env === "staging"
            ? true
            : isDevOrigin === true;

      const id = await NotificationsService.enqueue(req.body, {
        meta: { devOnly },
      });
      res.json({ ok: true, id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ ok: false, error: message.slice(0, 500) });
    }
  }
}
