import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import {
  createUserStatusMappingOverview,
  getPromotionsByStudentIdOverview,
  getUserStatusMappingsByStudentIdOverview,
  getUserStatusMastersOverview,
  updateUserStatusMappingOverview,
} from "../services/user-status-overview.service.js";

export async function getUserStatusMastersHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await getUserStatusMastersOverview();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", rows, "User status masters fetched."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getUserStatusMappingsByStudentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = parseInt(req.params.studentId as string, 10);
    if (Number.isNaN(studentId)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid studentId"));
      return;
    }
    const rows = await getUserStatusMappingsByStudentIdOverview(studentId);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", rows, "User status mappings fetched."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getStudentPromotionsOverviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = parseInt(req.params.studentId as string, 10);
    if (Number.isNaN(studentId)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid studentId"));
      return;
    }
    const { promotions, meta } =
      await getPromotionsByStudentIdOverview(studentId);
    res.status(200).json({
      httpStatusCode: 200,
      httpStatus: "SUCCESS",
      payload: promotions,
      meta,
      message: "Promotions fetched.",
    });
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createUserStatusMappingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = req.body as Parameters<
      typeof createUserStatusMappingOverview
    >[0];
    if (
      !body?.userId ||
      !body?.studentId ||
      !body?.sessionId ||
      !body?.promotionId ||
      !body?.byUserId ||
      !body?.userStatusMaster?.id
    ) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "BAD_REQUEST", null, "Missing required fields."),
        );
      return;
    }
    const created = await createUserStatusMappingOverview(body);
    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Could not create mapping.",
          ),
        );
      return;
    }
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "User status mapping created.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateUserStatusMappingHandler(
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
    const body = req.body as {
      remarks?: string | null;
      suspendedTillDate?: string | null;
      suspendedReason?: string | null;
      isActive?: boolean;
    };
    const updated = await updateUserStatusMappingOverview(id, body);
    if (!updated) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Mapping not found."));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "User status mapping updated.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
