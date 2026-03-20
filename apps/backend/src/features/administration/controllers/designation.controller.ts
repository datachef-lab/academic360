import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createDesignation as createDesignationService,
  deleteDesignationSafe as deleteDesignationSafeService,
  findDesignationById,
  getAllDesignations as getAllDesignationsService,
  updateDesignation as updateDesignationService,
} from "../services/designation.service.js";

export const createDesignation = async (req: Request, res: Response) => {
  try {
    const created = await createDesignationService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Designation created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllDesignations = async (_req: Request, res: Response) => {
  try {
    const all = await getAllDesignationsService();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", all, "Designations fetched."));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getDesignationById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const found = await findDesignationById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Designation not found."),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          found,
          "Designation fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateDesignation = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateDesignationService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Designation not found."),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "Designation updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteDesignation = async (req: Request, res: Response) => {
  try {
    const result = await deleteDesignationSafeService(Number(req.params.id));

    if (result === null) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Designation not found."),
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
