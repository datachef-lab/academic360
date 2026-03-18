import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  findAllDepartments,
  findDepartmentById,
  createDepartment as createDepartmentService,
  updateDepartment as updateDepartmentService,
  deleteDepartment as deleteDepartmentService,
  findDepartmentByName,
  findDepartmentByCode,
} from "@/features/administration/services/department.service.js";

// Create department
export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, code, description, legacyDepartmentId, parentDepartmentId } =
      req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    if (!code || typeof code !== "string") {
      res.status(400).json(new ApiError(400, "Code is required"));
      return;
    }

    const existingName = await findDepartmentByName(name);
    if (existingName) {
      res.status(409).json(new ApiError(409, "Department name already exists"));
      return;
    }

    const existingCode = await findDepartmentByCode(code);
    if (existingCode) {
      res.status(409).json(new ApiError(409, "Department code already exists"));
      return;
    }

    const deptData = {
      name,
      code,
      description: description || "",
      legacyDepartmentId: legacyDepartmentId
        ? Number(legacyDepartmentId)
        : null,
      parentDepartmentId: parentDepartmentId
        ? Number(parentDepartmentId)
        : null,
      isActive: true,
    };

    const newDept = await createDepartmentService(deptData as any);

    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", newDept, "Department created"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const departments = await findAllDepartments();
    res.status(200).json(new ApiResponse(200, "SUCCESS", departments, "OK"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getDepartmentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const dept = await findDepartmentById(Number(id));

    if (!dept) {
      res.status(404).json(new ApiError(404, "Department not found"));
      return;
    }

    res.status(200).json(new ApiResponse(200, "SUCCESS", dept, "OK"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      description,
      legacyDepartmentId,
      parentDepartmentId,
      isActive,
    } = req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findDepartmentById(Number(id));
    if (!existing) {
      res.status(404).json(new ApiError(404, "Department not found"));
      return;
    }

    if (name && name !== existing.name) {
      const dup = await findDepartmentByName(name);
      if (dup) {
        res
          .status(409)
          .json(new ApiError(409, "Department name already exists"));
        return;
      }
    }

    if (code && code !== existing.code) {
      const dup = await findDepartmentByCode(code);
      if (dup) {
        res
          .status(409)
          .json(new ApiError(409, "Department code already exists"));
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (legacyDepartmentId !== undefined)
      updateData.legacyDepartmentId = Number(legacyDepartmentId);
    if (parentDepartmentId !== undefined)
      updateData.parentDepartmentId = parentDepartmentId
        ? Number(parentDepartmentId)
        : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await updateDepartmentService(Number(id), updateData);

    if (!updated) {
      res.status(404).json(new ApiError(404, "Department not found"));
      return;
    }

    res.status(200).json(new ApiResponse(200, "SUCCESS", updated, "OK"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findDepartmentById(Number(id));
    if (!existing) {
      res.status(404).json(new ApiError(404, "Department not found"));
      return;
    }

    const deleted = await deleteDepartmentService(Number(id));

    res.status(200).json(new ApiResponse(200, "SUCCESS", deleted, "Deleted"));
  } catch (error) {
    handleError(error, res, next);
  }
};
