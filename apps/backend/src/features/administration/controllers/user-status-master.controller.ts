import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createUserStatusMaster as createUserStatusMasterService,
  deleteUserStatusMasterSafe as deleteUserStatusMasterSafeService,
  findUserStatusMasterById,
  getAllUserStatusMasters as getAllUserStatusMastersService,
  updateUserStatusMaster as updateUserStatusMasterService,
} from "../services/user-status-master.service.js";

export const createUserStatusMaster = async (req: Request, res: Response) => {
  try {
    const created = await createUserStatusMasterService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "User status master created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllUserStatusMasters = async (_req: Request, res: Response) => {
  try {
    const userStatusMasters = await getAllUserStatusMastersService();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          userStatusMasters,
          "User status masters fetched.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getUserStatusMasterById = async (req: Request, res: Response) => {
  try {
    const userStatusMaster = await findUserStatusMasterById(
      Number(req.params.id),
    );
    if (!userStatusMaster) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "User status master not found.",
          ),
        );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          userStatusMaster,
          "User status master fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateUserStatusMaster = async (req: Request, res: Response) => {
  try {
    const updated = await updateUserStatusMasterService(
      Number(req.params.id),
      req.body,
    );
    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "User status master not found.",
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
          "User status master updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteUserStatusMaster = async (req: Request, res: Response) => {
  try {
    const result = await deleteUserStatusMasterSafeService(
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
            "User status master not found.",
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
