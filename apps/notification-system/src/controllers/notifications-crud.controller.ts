import type { Request, Response } from "express";
import { handleError } from "@/utils/handle-error.js";
import { NotificationsCrudService } from "@/services/notifications-crud.service.js";

export class NotificationsCrudController {
  static async list(req: Request, res: Response) {
    try {
      const rows = await NotificationsCrudService.listNotifications();
      res.json({ ok: true, data: rows });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async get(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const row = await NotificationsCrudService.getNotification(id);
      res.json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async contents(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const rows = await NotificationsCrudService.listContents(id);
      res.json({ ok: true, data: rows });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async queue(req: Request, res: Response) {
    try {
      const rows = await NotificationsCrudService.listQueue();
      res.json({ ok: true, data: rows });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async queueItem(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const row = await NotificationsCrudService.getQueueItem(id);
      res.json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
}
