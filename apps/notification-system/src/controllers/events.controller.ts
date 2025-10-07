import type { Request, Response } from "express";
import { handleError } from "@/utils/handle-error.js";
import { NotificationEventsService } from "@/services/events.service.js";

export class EventsController {
  static async list(req: Request, res: Response) {
    try {
      const rows = await NotificationEventsService.list();
      res.json({ ok: true, data: rows });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async get(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const row = await NotificationEventsService.get(id);
      res.json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async create(req: Request, res: Response) {
    try {
      const row = await NotificationEventsService.create(req.body);
      res.status(201).json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const row = await NotificationEventsService.update(id, req.body);
      res.json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
}
