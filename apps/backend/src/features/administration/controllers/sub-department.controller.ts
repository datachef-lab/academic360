import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createSubDepartment,
  deleteSubDepartment,
  getAllSubDepartments,
  getSubDepartmentById,
  getSubDepartmentByName,
  getSubDepartmentByShortName,
  getSubDepartmentsByDepartmentId,
  updateSubDepartment,
} from "@/features/administration/services/sub-department.service.js";
import { getDepartmentById } from "@/features/administration/services/department.service.js";

export const createSubDepartmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { departmentId, name, shortName, description, isActive } = req.body;

    const parsedDepartmentId = Number(departmentId);
    if (!departmentId || Number.isNaN(parsedDepartmentId)) {
      res.status(400).json(new ApiError(400, "Valid departmentId is required"));
      return;
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      res
        .status(400)
        .json(new ApiError(400, "Sub-department name is required"));
      return;
    }

    if (!shortName || typeof shortName !== "string" || !shortName.trim()) {
      res
        .status(400)
        .json(new ApiError(400, "Sub-department short name is required"));
      return;
    }

    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      res
        .status(400)
        .json(new ApiError(400, "Sub-department description is required"));
      return;
    }

    const parentDepartment = await getDepartmentById(parsedDepartmentId);
    if (!parentDepartment) {
      res.status(404).json(new ApiError(404, "Department not found"));
      return;
    }

    const normalizedName = name.trim().toUpperCase();
    const normalizedShortName = shortName.trim().toUpperCase();
    const normalizedDescription = description.trim();

    const existingByName = await getSubDepartmentByName(
      parsedDepartmentId,
      normalizedName,
    );
    if (existingByName) {
      res
        .status(409)
        .json(
          new ApiError(
            409,
            "Sub-department name already exists for this department",
          ),
        );
      return;
    }

    const existingByShortName = await getSubDepartmentByShortName(
      parsedDepartmentId,
      normalizedShortName,
    );
    if (existingByShortName) {
      res
        .status(409)
        .json(
          new ApiError(
            409,
            "Sub-department short name already exists for this department",
          ),
        );
      return;
    }

    const subDepartment = await createSubDepartment({
      departmentId: parsedDepartmentId,
      name: normalizedName,
      shortName: normalizedShortName,
      description: normalizedDescription,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          subDepartment,
          "Sub-department created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getSubDepartmentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { departmentId } = req.query;

    let subDepartments;
    if (departmentId !== undefined) {
      const parsedDepartmentId = Number(departmentId);
      if (!departmentId || Number.isNaN(parsedDepartmentId)) {
        res
          .status(400)
          .json(new ApiError(400, "Valid departmentId is required"));
        return;
      }

      subDepartments =
        await getSubDepartmentsByDepartmentId(parsedDepartmentId);
    } else {
      subDepartments = await getAllSubDepartments();
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          subDepartments,
          "Sub-departments fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getSubDepartmentByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const subDepartmentId = Number(id);

    if (!id || Number.isNaN(subDepartmentId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid sub-department ID is required"));
      return;
    }

    const subDepartment = await getSubDepartmentById(subDepartmentId);
    if (!subDepartment) {
      res.status(404).json(new ApiError(404, "Sub-department not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          subDepartment,
          "Sub-department fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateSubDepartmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const subDepartmentId = Number(id);

    if (!id || Number.isNaN(subDepartmentId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid sub-department ID is required"));
      return;
    }

    const existingSubDepartment = await getSubDepartmentById(subDepartmentId);
    if (!existingSubDepartment) {
      res.status(404).json(new ApiError(404, "Sub-department not found"));
      return;
    }

    const { departmentId, name, shortName, description, isActive } = req.body;

    const updatePayload: Partial<{
      departmentId: number;
      name: string;
      shortName: string;
      description: string;
      isActive: boolean;
    }> = {};

    if (departmentId !== undefined) {
      const parsedDepartmentId = Number(departmentId);
      if (!departmentId || Number.isNaN(parsedDepartmentId)) {
        res
          .status(400)
          .json(new ApiError(400, "Valid departmentId is required"));
        return;
      }

      const parentDepartment = await getDepartmentById(parsedDepartmentId);
      if (!parentDepartment) {
        res.status(404).json(new ApiError(404, "Department not found"));
        return;
      }

      updatePayload.departmentId = parsedDepartmentId;
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res
          .status(400)
          .json(
            new ApiError(400, "Sub-department name must be a non-empty string"),
          );
        return;
      }

      const normalizedName = name.trim().toUpperCase();
      const departmentForNameCheck =
        updatePayload.departmentId ?? existingSubDepartment.departmentId;

      if (
        normalizedName !== existingSubDepartment.name ||
        departmentForNameCheck !== existingSubDepartment.departmentId
      ) {
        const duplicateName = await getSubDepartmentByName(
          departmentForNameCheck,
          normalizedName,
        );
        if (duplicateName && duplicateName.id !== subDepartmentId) {
          res
            .status(409)
            .json(
              new ApiError(
                409,
                "Sub-department name already exists for this department",
              ),
            );
          return;
        }
      }

      updatePayload.name = normalizedName;
    }

    if (shortName !== undefined) {
      if (typeof shortName !== "string" || !shortName.trim()) {
        res
          .status(400)
          .json(
            new ApiError(
              400,
              "Sub-department short name must be a non-empty string",
            ),
          );
        return;
      }

      const normalizedShortName = shortName.trim().toUpperCase();
      const departmentForShortNameCheck =
        updatePayload.departmentId ?? existingSubDepartment.departmentId;

      if (
        normalizedShortName !== existingSubDepartment.shortName ||
        departmentForShortNameCheck !== existingSubDepartment.departmentId
      ) {
        const duplicateShortName = await getSubDepartmentByShortName(
          departmentForShortNameCheck,
          normalizedShortName,
        );
        if (duplicateShortName && duplicateShortName.id !== subDepartmentId) {
          res
            .status(409)
            .json(
              new ApiError(
                409,
                "Sub-department short name already exists for this department",
              ),
            );
          return;
        }
      }

      updatePayload.shortName = normalizedShortName;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        res
          .status(400)
          .json(
            new ApiError(
              400,
              "Sub-department description must be a non-empty string",
            ),
          );
        return;
      }
      updatePayload.description = description.trim();
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

    const updatedSubDepartment = await updateSubDepartment(
      subDepartmentId,
      updatePayload,
    );

    if (!updatedSubDepartment) {
      res.status(404).json(new ApiError(404, "Sub-department not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedSubDepartment,
          "Sub-department updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteSubDepartmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const subDepartmentId = Number(id);

    if (!id || Number.isNaN(subDepartmentId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid sub-department ID is required"));
      return;
    }

    const existingSubDepartment = await getSubDepartmentById(subDepartmentId);
    if (!existingSubDepartment) {
      res.status(404).json(new ApiError(404, "Sub-department not found"));
      return;
    }

    await deleteSubDepartment(subDepartmentId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Sub-department deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
