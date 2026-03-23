import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createAccessGroupModuleClass as createAccessGroupModuleClassService,
  deleteAccessGroupModuleClassSafe as deleteAccessGroupModuleClassSafeService,
  findAccessGroupModuleClassById,
  getAllAccessGroupModuleClasses as getAllAccessGroupModuleClassesService,
  updateAccessGroupModuleClass as updateAccessGroupModuleClassService,
} from "../services/access-group-module-class.service.js";

export const createAccessGroupModuleClass = async (
  req: Request,
  res: Response,
) => {
  try {
    const created = await createAccessGroupModuleClassService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Access group module class created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllAccessGroupModuleClasses = async (
  _req: Request,
  res: Response,
) => {
  try {
    const all = await getAllAccessGroupModuleClassesService();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          all,
          "Access group module classes fetched.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getAccessGroupModuleClassById = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const found = await findAccessGroupModuleClassById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group module class not found.",
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
          "Access group module class fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateAccessGroupModuleClass = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateAccessGroupModuleClassService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Access group module class not found.",
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
          "Access group module class updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteAccessGroupModuleClass = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await deleteAccessGroupModuleClassSafeService(
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
            "Access group module class not found.",
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
