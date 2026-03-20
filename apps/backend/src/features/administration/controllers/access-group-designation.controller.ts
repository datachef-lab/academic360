import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createAccessGroupDesignation as createAccessGroupDesignationService,
  deleteAccessGroupDesignationSafe as deleteAccessGroupDesignationSafeService,
  findAccessGroupDesignationById,
  getAllAccessGroupDesignations as getAllAccessGroupDesignationsService,
  updateAccessGroupDesignation as updateAccessGroupDesignationService,
} from "../services/access-group-designation.service.js";

export const createAccessGroupDesignation = async (
  req: Request,
  res: Response,
) => {
  try {
    const created = await createAccessGroupDesignationService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Access group designation created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllAccessGroupDesignations = async (
  _req: Request,
  res: Response,
) => {
  try {
    const all = await getAllAccessGroupDesignationsService();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          all,
          "Access group designations fetched.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getAccessGroupDesignationById = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const found = await findAccessGroupDesignationById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group designation not found.",
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
          "Access group designation fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateAccessGroupDesignation = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateAccessGroupDesignationService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group designation not found.",
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
          "Access group designation updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteAccessGroupDesignation = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await deleteAccessGroupDesignationSafeService(
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
            "Access group designation not found.",
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
