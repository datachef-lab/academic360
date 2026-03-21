import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createAccessGroupApplication as createAccessGroupApplicationService,
  deleteAccessGroupApplicationSafe as deleteAccessGroupApplicationSafeService,
  findAccessGroupApplicationById,
  getAllAccessGroupApplications as getAllAccessGroupApplicationsService,
  updateAccessGroupApplication as updateAccessGroupApplicationService,
} from "../services/access-group-application.service.js";

export const createAccessGroupApplication = async (
  req: Request,
  res: Response,
) => {
  try {
    const created = await createAccessGroupApplicationService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Access group application created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllAccessGroupApplications = async (
  _req: Request,
  res: Response,
) => {
  try {
    const all = await getAllAccessGroupApplicationsService();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          all,
          "Access group applications fetched.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getAccessGroupApplicationById = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const found = await findAccessGroupApplicationById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group application not found.",
          ),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          found,
          "Access group application fetched.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateAccessGroupApplication = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateAccessGroupApplicationService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group application not found.",
          ),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "Access group application updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteAccessGroupApplication = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await deleteAccessGroupApplicationSafeService(
      Number(req.params.id),
    );

    if (result === null) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group application not found.",
          ),
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
