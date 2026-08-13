import type { Request, Response } from "express";
import {
  getDashboardFeeClearance,
  getDashboardHandovers,
  getDashboardSummary,
} from "../services/documents-dashboard.service.js";

export async function getDocumentsDashboardSummary(
  _req: Request,
  res: Response,
) {
  try {
    const payload = await getDashboardSummary();
    return res.json({ payload });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load the documents dashboard summary",
      error: String(error),
    });
  }
}

export async function getDocumentsDashboardHandovers(
  req: Request,
  res: Response,
) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const payload = await getDashboardHandovers(
      limit && Number.isFinite(limit) ? limit : undefined,
    );
    return res.json({ payload });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load recent handovers",
      error: String(error),
    });
  }
}

export async function getDocumentsDashboardFeeClearance(
  req: Request,
  res: Response,
) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const payload = await getDashboardFeeClearance(
      limit && Number.isFinite(limit) ? limit : undefined,
    );
    return res.json({ payload });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load fee-clearance blocks",
      error: String(error),
    });
  }
}
