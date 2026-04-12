import { NextFunction, Request, Response } from "express";
import { createPromotionBuilderSchema } from "@repo/db/schemas";
import { ApiResponse, handleError } from "@/utils/index.js";
import * as promotionBuilderService from "../services/promotion-builder.service.js";
import { z } from "zod";

const ruleSchema = z.object({
  promotionClauseId: z.number().int().positive(),
  operator: z.enum(["EQUALS", "NONE_IN"]),
  classIds: z.array(z.number().int().positive()),
});

const createBodySchema = createPromotionBuilderSchema.extend({
  rules: z.array(ruleSchema).optional(),
});

const replaceRulesBodySchema = z.object({
  rules: z.array(ruleSchema),
});

export async function getPromotionBuilderByTargetHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const affiliationId = parseInt(String(req.query.affiliationId ?? ""), 10);
    const targetClassId = parseInt(String(req.query.targetClassId ?? ""), 10);
    if (
      Number.isNaN(affiliationId) ||
      affiliationId < 1 ||
      Number.isNaN(targetClassId) ||
      targetClassId < 1
    ) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "affiliationId and targetClassId are required positive integers",
          ),
        );
      return;
    }

    const row =
      await promotionBuilderService.findActivePromotionBuilderByAffiliationAndTargetClass(
        affiliationId,
        targetClassId,
      );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          row
            ? "Promotion builder for target class"
            : "No active promotion builder for this affiliation and target class",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getPromotionBuildersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const affRaw = req.query.affiliationId;
    const affiliationId =
      affRaw != null && affRaw !== ""
        ? parseInt(String(affRaw), 10)
        : undefined;
    if (
      affiliationId !== undefined &&
      (Number.isNaN(affiliationId) || affiliationId < 1)
    ) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "BAD_REQUEST", null, "Invalid affiliationId"),
        );
      return;
    }

    const rows =
      await promotionBuilderService.findAllPromotionBuilders(affiliationId);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", rows, "Promotion builders fetched"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getPromotionBuilderByIdHandler(
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

    const row = await promotionBuilderService.findPromotionBuilderById(id);
    if (!row) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Promotion builder not found",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Promotion builder retrieved"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createPromotionBuilderHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createBodySchema.parse(req.body);
    const { rules, ...rest } = parsed;
    const created = await promotionBuilderService.createPromotionBuilder(
      rest,
      rules,
    );
    if (!created) {
      res
        .status(500)
        .json(new ApiResponse(500, "ERROR", null, "Create failed"));
      return;
    }
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", created, "Promotion builder created"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updatePromotionBuilderHandler(
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

    const updateBodySchema = createPromotionBuilderSchema.partial().extend({
      rules: z.array(ruleSchema).optional(),
    });
    const parsed = updateBodySchema.parse(req.body);
    const { rules, ...builderFields } = parsed;
    const updated = await promotionBuilderService.updatePromotionBuilder(
      id,
      builderFields,
      { rules },
    );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Promotion builder not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", updated, "Promotion builder updated"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function replacePromotionBuilderRulesHandler(
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

    const { rules } = replaceRulesBodySchema.parse(req.body);
    const updated = await promotionBuilderService.replacePromotionBuilderRules(
      id,
      rules,
    );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Promotion builder not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Promotion builder rules replaced",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deletePromotionBuilderHandler(
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

    const ok = await promotionBuilderService.deletePromotionBuilder(id);
    if (!ok) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Promotion builder not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", { id }, "Promotion builder deleted"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
