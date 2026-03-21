import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createSessionStatus as createSessionStatusService,
  deleteSessionStatusSafe as deleteSessionStatusSafeService,
  findSessionStatusById,
  getAllSessionStatuses as getAllSessionStatusesService,
  updateSessionStatus as updateSessionStatusService,
} from "../services/session-status.service.js";

export const createSessionStatus = async (req: Request, res: Response) => {
  try {
    const created = await createSessionStatusService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Session status created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllSessionStatuses = async (_req: Request, res: Response) => {
  try {
    const all = await getAllSessionStatusesService();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", all, "Session statuses fetched."));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getSessionStatusById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const found = await findSessionStatusById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Session status not found."),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          found,
          "Session status fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateSessionStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateSessionStatusService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Session status not found."),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "Session status updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteSessionStatus = async (req: Request, res: Response) => {
  try {
    const result = await deleteSessionStatusSafeService(Number(req.params.id));

    if (result === null) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Session status not found."),
        );
    }

    if (result.success === false) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", result.records, result.message));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "DELETED", null, result.message ?? "Deleted."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};
