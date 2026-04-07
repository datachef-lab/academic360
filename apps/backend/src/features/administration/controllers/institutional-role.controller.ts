import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createInstitutionalRole as createInstitutionalRoleService,
  deleteInstitutionalRoleSafe as deleteInstitutionalRoleSafeService,
  findInstitutionalRoleById,
  getAllInstitutionalRoles as getAllInstitutionalRolesService,
  updateInstitutionalRole as updateInstitutionalRoleService,
} from "../services/institutional-role.service.js";

export const createInstitutionalRole = async (req: Request, res: Response) => {
  try {
    const created = await createInstitutionalRoleService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Institutional role created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllInstitutionalRoles = async (
  _req: Request,
  res: Response,
) => {
  try {
    const all = await getAllInstitutionalRolesService();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", all, "Institutional roles fetched."),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getInstitutionalRoleById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const found = await findInstitutionalRoleById(id);

    if (!found) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Institutional role not found.",
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
          "Institutional role fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateInstitutionalRole = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateInstitutionalRoleService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Institutional role not found.",
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
          "Institutional role updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteInstitutionalRole = async (req: Request, res: Response) => {
  try {
    const result = await deleteInstitutionalRoleSafeService(
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
            "Institutional role not found.",
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
