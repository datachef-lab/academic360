import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentByCode,
  getDepartmentById,
  getDepartmentByName,
  updateDepartment,
} from "@/features/administration/services/department.service.js";

export const createDepartmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, code, description, legacyDepartmentId, isActive } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Department name is required"));
      return;
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      res.status(400).json(new ApiError(400, "Department code is required"));
      return;
    }

    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      res
        .status(400)
        .json(new ApiError(400, "Department description is required"));
      return;
    }

    const normalizedName = name.trim().toUpperCase();
    const normalizedCode = code.trim().toUpperCase();
    const normalizedDescription = description.trim();

    const existingWithName = await getDepartmentByName(normalizedName);
    if (existingWithName) {
      res.status(409).json(new ApiError(409, "Department name already exists"));
      return;
    }

    const existingWithCode = await getDepartmentByCode(normalizedCode);
    if (existingWithCode) {
      res.status(409).json(new ApiError(409, "Department code already exists"));
      return;
    }

    const department = await createDepartment({
      name: normalizedName,
      code: normalizedCode,
      description: normalizedDescription,
      legacyDepartmentId:
        typeof legacyDepartmentId === "number"
          ? legacyDepartmentId
          : legacyDepartmentId === null
            ? null
            : undefined,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          department,
          "Department created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getDepartmentsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const departments = await getAllDepartments();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          departments,
          "Departments fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getDepartmentByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const departmentId = Number(id);

    if (!id || Number.isNaN(departmentId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid department ID is required"));
      return;
    }

    const department = await getDepartmentById(departmentId);
    if (!department) {
      res.status(404).json(new ApiError(404, "Department not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          department,
          "Department fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateDepartmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const departmentId = Number(id);

    if (!id || Number.isNaN(departmentId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid department ID is required"));
      return;
    }

    const existingDepartment = await getDepartmentById(departmentId);
    if (!existingDepartment) {
      res.status(404).json(new ApiError(404, "Department not found"));
      return;
    }

    const { name, code, description, legacyDepartmentId, isActive } = req.body;

    const updatePayload: Partial<{
      name: string;
      code: string;
      description: string;
      legacyDepartmentId: number | null;
      isActive: boolean;
    }> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res
          .status(400)
          .json(
            new ApiError(400, "Department name must be a non-empty string"),
          );
        return;
      }
      const normalizedName = name.trim().toUpperCase();
      if (normalizedName !== existingDepartment.name) {
        const duplicateName = await getDepartmentByName(normalizedName);
        if (duplicateName && duplicateName.id !== departmentId) {
          res
            .status(409)
            .json(new ApiError(409, "Department name already exists"));
          return;
        }
      }
      updatePayload.name = normalizedName;
    }

    if (code !== undefined) {
      if (typeof code !== "string" || !code.trim()) {
        res
          .status(400)
          .json(
            new ApiError(400, "Department code must be a non-empty string"),
          );
        return;
      }
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode !== existingDepartment.code) {
        const duplicateCode = await getDepartmentByCode(normalizedCode);
        if (duplicateCode && duplicateCode.id !== departmentId) {
          res
            .status(409)
            .json(new ApiError(409, "Department code already exists"));
          return;
        }
      }
      updatePayload.code = normalizedCode;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        res
          .status(400)
          .json(
            new ApiError(
              400,
              "Department description must be a non-empty string",
            ),
          );
        return;
      }
      updatePayload.description = description.trim();
    }

    if (legacyDepartmentId !== undefined) {
      if (
        legacyDepartmentId !== null &&
        (typeof legacyDepartmentId !== "number" ||
          Number.isNaN(Number(legacyDepartmentId)))
      ) {
        res
          .status(400)
          .json(
            new ApiError(400, "legacyDepartmentId must be a number or null"),
          );
        return;
      }
      updatePayload.legacyDepartmentId =
        legacyDepartmentId === null ? null : Number(legacyDepartmentId);
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        res
          .status(400)
          .json(new ApiError(400, "isActive must be a boolean value"));
        return;
      }
      updatePayload.isActive = isActive;
    }

    if (Object.keys(updatePayload).length === 0) {
      res
        .status(400)
        .json(new ApiError(400, "No valid fields provided for update"));
      return;
    }

    const updatedDepartment = await updateDepartment(
      departmentId,
      updatePayload,
    );

    if (!updatedDepartment) {
      res.status(404).json(new ApiError(404, "Department not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedDepartment,
          "Department updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteDepartmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const departmentId = Number(id);

    if (!id || Number.isNaN(departmentId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid department ID is required"));
      return;
    }

    const existingDepartment = await getDepartmentById(departmentId);
    if (!existingDepartment) {
      res.status(404).json(new ApiError(404, "Department not found"));
      return;
    }

    await deleteDepartment(departmentId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Department deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
