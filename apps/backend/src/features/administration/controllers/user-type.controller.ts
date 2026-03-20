import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createUserType as createUserTypeService,
  deleteUserTypeSafe as deleteUserTypeSafeService,
  findUserTypeById,
  getAllUserTypes as getAllUserTypesService,
  updateUserType as updateUserTypeService,
} from "../services/user-type.service.js";

export const createUserType = async (req: Request, res: Response) => {
  try {
    const created = await createUserTypeService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "User type created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllUserTypes = async (_req: Request, res: Response) => {
  try {
    const userTypes = await getAllUserTypesService();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", userTypes, "User types fetched."));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getUserTypeById = async (req: Request, res: Response) => {
  try {
    const userType = await findUserTypeById(Number(req.params.id));
    if (!userType) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "User type not found."));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          userType,
          "User type fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateUserType = async (req: Request, res: Response) => {
  try {
    const updated = await updateUserTypeService(
      Number(req.params.id),
      req.body,
    );
    if (!updated) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "User type not found."));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "User type updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteUserType = async (req: Request, res: Response) => {
  try {
    const result = await deleteUserTypeSafeService(Number(req.params.id));

    if (result === null) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "User type not found."));
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
