import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createIdentityMaster as createIdentityMasterService,
  deleteIdentityMasterSafe as deleteIdentityMasterSafeService,
  findIdentityMasterById,
  getAllIdentityMasters as getAllIdentityMastersService,
  updateIdentityMaster as updateIdentityMasterService,
} from "../services/identity-master.service.js";

export const createIdentityMaster = async (req: Request, res: Response) => {
  try {
    const created = await createIdentityMasterService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Identity master created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllIdentityMasters = async (_req: Request, res: Response) => {
  try {
    const all = await getAllIdentityMastersService();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", all, "Identity masters fetched."));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getIdentityMasterById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const found = await findIdentityMasterById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Identity master not found."),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          found,
          "Identity master fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateIdentityMaster = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateIdentityMasterService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Identity master not found."),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "Identity master updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteIdentityMaster = async (req: Request, res: Response) => {
  try {
    const result = await deleteIdentityMasterSafeService(Number(req.params.id));

    if (result === null) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Identity master not found."),
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
