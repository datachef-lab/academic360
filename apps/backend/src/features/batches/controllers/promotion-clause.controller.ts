import { NextFunction, Request, Response } from "express";
import { createPromotionClauseSchema } from "@repo/db/schemas";
import { ApiResponse, handleError } from "@/utils/index.js";
import * as promotionClauseService from "../services/promotion-clause.service.js";
import { z } from "zod";

const replaceClassMappingsSchema = z.object({
  classIds: z.array(z.number().int().positive()),
});

export async function getPromotionClausesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const activeRaw = req.query.isActive;
    const isActive =
      activeRaw === "true" ? true : activeRaw === "false" ? false : undefined;

    const rows = await promotionClauseService.findAllPromotionClauses({
      isActive,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Promotion clauses fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getPromotionClauseByIdHandler(
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

    const row = await promotionClauseService.findPromotionClauseById(id);
    if (!row) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Promotion clause not found"),
        );
      return;
    }

    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Promotion clause retrieved"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createPromotionClauseHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createPromotionClauseSchema.parse(req.body);
    const created = await promotionClauseService.createPromotionClause(parsed);
    if (!created) {
      res
        .status(500)
        .json(new ApiResponse(500, "ERROR", null, "Create failed"));
      return;
    }
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", created, "Promotion clause created"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updatePromotionClauseHandler(
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

    const updateBodySchema = createPromotionClauseSchema.partial().extend({
      classIds: z.array(z.number().int().positive()).optional(),
    });
    const parsed = updateBodySchema.parse(req.body);
    const { classIds, ...clauseFields } = parsed;
    const updated = await promotionClauseService.updatePromotionClause(
      id,
      clauseFields,
      { classIds },
    );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Promotion clause not found"),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", updated, "Promotion clause updated"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function replacePromotionClauseClassMappingsHandler(
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

    const { classIds } = replaceClassMappingsSchema.parse(req.body);
    const updated =
      await promotionClauseService.replacePromotionClauseClassMappings(
        id,
        classIds,
      );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Promotion clause not found"),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", updated, "Class mappings replaced"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deletePromotionClauseHandler(
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

    const ok = await promotionClauseService.deletePromotionClause(id);
    if (!ok) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Promotion clause not found"),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", { id }, "Promotion clause deleted"),
      );
  } catch (error: any) {
    if (error?.statusCode === 409) {
      res
        .status(409)
        .json(
          new ApiResponse(
            409,
            "CONFLICT",
            null,
            error.message || "Clause is in use",
          ),
        );
      return;
    }
    handleError(error, res, next);
  }
}
