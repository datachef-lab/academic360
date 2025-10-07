import type { Request, Response } from "express";
import { handleError } from "@/utils/handle-error.js";
import { NotificationMastersService } from "@/services/masters.service.js";

export class MastersController {
  static async list(req: Request, res: Response) {
    try {
      const rows = await NotificationMastersService.listMasters();
      res.json({ ok: true, data: rows });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async get(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const row = await NotificationMastersService.getMaster(id);
      res.json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async create(req: Request, res: Response) {
    try {
      const row = await NotificationMastersService.createMaster(req.body);
      res.status(201).json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const row = await NotificationMastersService.updateMaster(id, req.body);
      res.json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async listFields(req: Request, res: Response) {
    try {
      const masterId = Number(req.params.masterId);
      const rows = await NotificationMastersService.listFields(masterId);
      res.json({ ok: true, data: rows });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async createField(req: Request, res: Response) {
    try {
      const row = await NotificationMastersService.createField(req.body);
      res.status(201).json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async deleteField(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await NotificationMastersService.deleteField(id);
      res.json({ ok: true });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async listMeta(req: Request, res: Response) {
    try {
      const masterId = Number(req.params.masterId);
      const rows = await NotificationMastersService.listMeta(masterId);
      res.json({ ok: true, data: rows });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async createMeta(req: Request, res: Response) {
    try {
      const row = await NotificationMastersService.createMeta(req.body);
      res.status(201).json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async updateMeta(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const row = await NotificationMastersService.updateMeta(id, req.body);
      res.json({ ok: true, data: row });
    } catch (err) {
      handleError(err, res);
    }
  }
  static async deleteMeta(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await NotificationMastersService.deleteMeta(id);
      res.json({ ok: true });
    } catch (err) {
      handleError(err, res);
    }
  }
}
