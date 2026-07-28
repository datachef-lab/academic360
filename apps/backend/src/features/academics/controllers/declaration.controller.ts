import type { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  DeclarationValidationError,
  findDeclarationByPromotionAndContext,
  submitDeclaration,
} from "../services/declaration.service.js";

/**
 * GET /api/academics/declarations/promotion/:promotionId?context=FEES
 * Returns the active master for the context plus the student's existing
 * declaration (null when they haven't declared yet for this promotion).
 */
export async function getDeclarationForPromotionHandler(
  req: Request,
  res: Response,
) {
  try {
    const promotionId = Number(req.params.promotionId);
    const context = String(req.query.context ?? "").trim();

    if (!Number.isFinite(promotionId) || promotionId <= 0 || !context) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Valid promotionId and context are required",
          ),
        );
    }

    const result = await findDeclarationByPromotionAndContext(
      promotionId,
      context as never,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Declaration state fetched"),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

/** POST /api/academics/declarations — records the student's agreement. */
export async function submitDeclarationHandler(req: Request, res: Response) {
  try {
    const { promotionId, declarationMasterId, statements } = req.body ?? {};

    if (
      !Number.isFinite(Number(promotionId)) ||
      !Number.isFinite(Number(declarationMasterId)) ||
      !Array.isArray(statements)
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "promotionId, declarationMasterId and statements[] are required",
          ),
        );
    }

    const result = await submitDeclaration({
      promotionId: Number(promotionId),
      declarationMasterId: Number(declarationMasterId),
      statements,
    });

    return res
      .status(result.created ? 201 : 200)
      .json(
        new ApiResponse(
          result.created ? 201 : 200,
          result.created ? "CREATED" : "SUCCESS",
          result.declaration,
          result.created
            ? "Declaration recorded"
            : "Declaration already recorded for this promotion",
        ),
      );
  } catch (error) {
    if (error instanceof DeclarationValidationError) {
      return res
        .status(422)
        .json(new ApiResponse(422, "UNPROCESSABLE", null, error.message));
    }
    return handleError(error, res);
  }
}
