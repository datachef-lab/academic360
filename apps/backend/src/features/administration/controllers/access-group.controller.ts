import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createAccessGroup as createAccessGroupService,
  deleteAccessGroupSafe as deleteAccessGroupSafeService,
  findAccessGroupById,
  getAllAccessGroups as getAllAccessGroupsService,
  updateAccessGroup as updateAccessGroupService,
} from "../services/access-group.service.js";

export const createAccessGroup = async (req: Request, res: Response) => {
  try {
    const created = await createAccessGroupService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Access group created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllAccessGroups = async (_req: Request, res: Response) => {
  try {
    const all = await getAllAccessGroupsService();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", all, "Access groups fetched."));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getAccessGroupById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const found = await findAccessGroupById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Access group not found."),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          found,
          "Access group fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateAccessGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateAccessGroupService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Access group not found."),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "Access group updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteAccessGroup = async (req: Request, res: Response) => {
  try {
    const result = await deleteAccessGroupSafeService(Number(req.params.id));

    if (result === null) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Access group not found."),
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
