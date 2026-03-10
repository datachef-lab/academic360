import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createUserStatusSessionMapping,
  deleteUserStatusSessionMapping,
  getUserStatusSessionMappingById,
  getUserStatusSessionMappingsByUserId,
  getUserStatusSessionMappingsBySessionId,
  getAllUserStatusSessionMappings,
  updateUserStatusSessionMapping,
} from "@/features/administration/services/user-status-session-mapping.service.js";

export const createUserStatusSessionMappingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      userId,
      sessionId,
      userStatusReasonId,
      suspendedTillDate,
      remarks,
      byUserId,
      isActive,
    } = req.body;

    if (typeof userId !== "number" || Number.isNaN(userId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid userId (number) is required"));
      return;
    }

    if (typeof sessionId !== "number" || Number.isNaN(sessionId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid sessionId (number) is required"));
      return;
    }

    if (typeof byUserId !== "number" || Number.isNaN(byUserId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid byUserId (number) is required"));
      return;
    }

    const createPayload = {
      userId,
      sessionId,
      userStatusReasonId:
        userStatusReasonId !== undefined && userStatusReasonId !== null
          ? Number(userStatusReasonId)
          : null,
      suspendedTillDate:
        suspendedTillDate != null ? new Date(suspendedTillDate) : null,
      remarks: typeof remarks === "string" ? remarks.trim() || null : null,
      byUserId,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };
    const created = await createUserStatusSessionMapping(createPayload);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "User status session mapping created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStatusSessionMappingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userIdParam = req.query.userId as string | undefined;
    const sessionIdParam = req.query.sessionId as string | undefined;

    if (userIdParam !== undefined) {
      const userId = Number(userIdParam);
      if (Number.isNaN(userId)) {
        res
          .status(400)
          .json(new ApiError(400, "userId must be a valid number"));
        return;
      }
      const mappings = await getUserStatusSessionMappingsByUserId(userId);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            mappings,
            "User status session mappings fetched successfully",
          ),
        );
    } else if (sessionIdParam !== undefined) {
      const sessionId = Number(sessionIdParam);
      if (Number.isNaN(sessionId)) {
        res
          .status(400)
          .json(new ApiError(400, "sessionId must be a valid number"));
        return;
      }
      const mappings = await getUserStatusSessionMappingsBySessionId(sessionId);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            mappings,
            "User status session mappings fetched successfully",
          ),
        );
    } else {
      const mappings = await getAllUserStatusSessionMappings();
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            mappings,
            "User status session mappings fetched successfully",
          ),
        );
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStatusSessionMappingByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const mappingId = Number(id);

    if (!id || Number.isNaN(mappingId)) {
      res
        .status(400)
        .json(
          new ApiError(400, "Valid user status session mapping ID is required"),
        );
      return;
    }

    const mapping = await getUserStatusSessionMappingById(mappingId);
    if (!mapping) {
      res
        .status(404)
        .json(new ApiError(404, "User status session mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mapping,
          "User status session mapping fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateUserStatusSessionMappingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const mappingId = Number(id);

    if (!id || Number.isNaN(mappingId)) {
      res
        .status(400)
        .json(
          new ApiError(400, "Valid user status session mapping ID is required"),
        );
      return;
    }

    const existing = await getUserStatusSessionMappingById(mappingId);
    if (!existing) {
      res
        .status(404)
        .json(new ApiError(404, "User status session mapping not found"));
      return;
    }

    const { userStatusReasonId, suspendedTillDate, remarks, isActive } =
      req.body;

    const updatePayload: Partial<{
      userStatusReasonId: number | null;
      suspendedTillDate: Date | null;
      remarks: string | null;
      isActive: boolean;
    }> = {};

    if (userStatusReasonId !== undefined) {
      updatePayload.userStatusReasonId =
        userStatusReasonId === null ? null : Number(userStatusReasonId);
    }

    if (suspendedTillDate !== undefined) {
      updatePayload.suspendedTillDate =
        suspendedTillDate == null ? null : new Date(suspendedTillDate);
    }

    if (remarks !== undefined) {
      updatePayload.remarks =
        typeof remarks === "string" ? remarks.trim() || null : null;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        res.status(400).json(new ApiError(400, "isActive must be a boolean"));
        return;
      }
      updatePayload.isActive = isActive;
    }

    if (Object.keys(updatePayload).length === 0) {
      res
        .status(400)
        .json(new ApiError(400, "No valid fields provided for update"));
      return;
    }

    const updated = await updateUserStatusSessionMapping(
      mappingId,
      updatePayload,
    );

    if (!updated) {
      res
        .status(404)
        .json(new ApiError(404, "User status session mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "User status session mapping updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUserStatusSessionMappingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const mappingId = Number(id);

    if (!id || Number.isNaN(mappingId)) {
      res
        .status(400)
        .json(
          new ApiError(400, "Valid user status session mapping ID is required"),
        );
      return;
    }

    const existing = await getUserStatusSessionMappingById(mappingId);
    if (!existing) {
      res
        .status(404)
        .json(new ApiError(404, "User status session mapping not found"));
      return;
    }

    await deleteUserStatusSessionMapping(mappingId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "User status session mapping deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
