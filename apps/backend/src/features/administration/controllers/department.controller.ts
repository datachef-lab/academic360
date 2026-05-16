import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  createDepartment as createDepartmentService,
  deleteDepartmentSafe as deleteDepartmentSafeService,
  findDepartmentById,
  getAllDepartments as getAllDepartmentsService,
  updateDepartment as updateDepartmentService,
} from "../services/department.service.js";

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const created = await createDepartmentService(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Department created successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const getAllDepartments = async (_req: Request, res: Response) => {
  try {
    const all = await getAllDepartmentsService();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", all, "Departments fetched."));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const found = await findDepartmentById(id);

    if (!found) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Department not found."));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          found,
          "Department fetched successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await updateDepartmentService(id, req.body);

    if (!updated) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Department not found."));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updated,
          "Department updated successfully.",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(new ApiResponse(400, "ERROR", null, message));
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const result = await deleteDepartmentSafeService(Number(req.params.id));

    if (result === null) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Department not found."));
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
