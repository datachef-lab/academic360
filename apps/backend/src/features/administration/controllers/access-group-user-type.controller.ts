import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createAccessGroupUserType as createAccessGroupUserTypeService,
  deleteAccessGroupUserTypeSafe as deleteAccessGroupUserTypeSafeService,
  findAccessGroupUserTypeById,
  getAllAccessGroupUserTypes as getAllAccessGroupUserTypesService,
  updateAccessGroupUserType as updateAccessGroupUserTypeService,
} from "../services/access-group-user-type.service.js";

export const createAccessGroupUserType = async (
  req: Request,
  res: Response,
) => {
  try {
    const created = await createAccessGroupUserTypeService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Access group user type created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllAccessGroupUserTypes = async (
  _req: Request,
  res: Response,
) => {
  try {
    const all = await getAllAccessGroupUserTypesService();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          all,
          "Access group user types fetched.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getAccessGroupUserTypeById = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const found = await findAccessGroupUserTypeById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group user type not found.",
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
          "Access group user type fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateAccessGroupUserType = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateAccessGroupUserTypeService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group user type not found.",
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
          "Access group user type updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteAccessGroupUserType = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await deleteAccessGroupUserTypeSafeService(
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
            "Access group user type not found.",
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
