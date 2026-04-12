import { NextFunction, Request, Response } from "express";
import { promotionStatusInsertSchema } from "@repo/db/schemas";
import { ApiResponse, handleError } from "@/utils/index.js";
import * as promotionStatusService from "../services/promotion-status.service.js";

export async function getPromotionStatusesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const activeRaw = req.query.isActive;
    const isActive =
      activeRaw === "true" ? true : activeRaw === "false" ? false : undefined;

    const rows = await promotionStatusService.findAllPromotionStatuses({
      isActive,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Appear types fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getPromotionStatusByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
      return;
    }

    const row = await promotionStatusService.findPromotionStatusById(id);
    if (!row) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Appear type not found"));
      return;
    }

    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Appear type retrieved"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createPromotionStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = promotionStatusInsertSchema.parse(req.body);
    const created = await promotionStatusService.createPromotionStatus(parsed);
    if (!created) {
      res
        .status(500)
        .json(new ApiResponse(500, "ERROR", null, "Create failed"));
      return;
    }
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", created, "Appear type created"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updatePromotionStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
      return;
    }

    const parsed = promotionStatusInsertSchema.partial().parse(req.body);
    const updated = await promotionStatusService.updatePromotionStatus(
      id,
      parsed,
    );
    if (!updated) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Appear type not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", updated, "Appear type updated"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deletePromotionStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
      return;
    }

    const ok = await promotionStatusService.deletePromotionStatus(id);
    if (!ok) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Appear type not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", { id }, "Appear type deleted"));
  } catch (error) {
    handleError(error, res, next);
  }
}
