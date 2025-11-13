import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createDesignation,
  deleteDesignation,
  getAllDesignations,
  getDesignationById,
  getDesignationByName,
  updateDesignation,
} from "@/features/administration/services/designation.service.js";

export const createDesignationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, description, legacyDesignationId, isActive } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Designation name is required"));
      return;
    }

    const normalizedName = name.trim().toUpperCase();

    const existingDesignation = await getDesignationByName(normalizedName);
    if (existingDesignation) {
      res
        .status(409)
        .json(new ApiError(409, "Designation name already exists"));
      return;
    }

    const designation = await createDesignation({
      name: normalizedName,
      description:
        typeof description === "string" ? description.trim() || null : null,
      legacyDesignationId:
        typeof legacyDesignationId === "number"
          ? legacyDesignationId
          : legacyDesignationId === null
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
          designation,
          "Designation created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getDesignationsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const designations = await getAllDesignations();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          designations,
          "Designations fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getDesignationByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const designationId = Number(id);

    if (!id || Number.isNaN(designationId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid designation ID is required"));
      return;
    }

    const designation = await getDesignationById(designationId);
    if (!designation) {
      res.status(404).json(new ApiError(404, "Designation not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          designation,
          "Designation fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateDesignationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const designationId = Number(id);

    if (!id || Number.isNaN(designationId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid designation ID is required"));
      return;
    }

    const existingDesignation = await getDesignationById(designationId);
    if (!existingDesignation) {
      res.status(404).json(new ApiError(404, "Designation not found"));
      return;
    }

    const { name, description, legacyDesignationId, isActive } = req.body;

    const updatePayload: Partial<{
      name: string;
      description: string | null;
      legacyDesignationId: number | null;
      isActive: boolean;
    }> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res
          .status(400)
          .json(
            new ApiError(400, "Designation name must be a non-empty string"),
          );
        return;
      }
      const normalizedName = name.trim().toUpperCase();
      if (normalizedName !== existingDesignation.name) {
        const duplicate = await getDesignationByName(normalizedName);
        if (duplicate && duplicate.id !== designationId) {
          res
            .status(409)
            .json(new ApiError(409, "Designation name already exists"));
          return;
        }
      }
      updatePayload.name = normalizedName;
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        res
          .status(400)
          .json(
            new ApiError(
              400,
              "Designation description must be a string or null",
            ),
          );
        return;
      }
      updatePayload.description =
        typeof description === "string" ? description.trim() || null : null;
    }

    if (legacyDesignationId !== undefined) {
      if (
        legacyDesignationId !== null &&
        (typeof legacyDesignationId !== "number" ||
          Number.isNaN(Number(legacyDesignationId)))
      ) {
        res
          .status(400)
          .json(
            new ApiError(400, "legacyDesignationId must be a number or null"),
          );
        return;
      }
      updatePayload.legacyDesignationId =
        legacyDesignationId === null ? null : Number(legacyDesignationId);
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

    const updatedDesignation = await updateDesignation(
      designationId,
      updatePayload,
    );

    if (!updatedDesignation) {
      res.status(404).json(new ApiError(404, "Designation not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedDesignation,
          "Designation updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteDesignationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const designationId = Number(id);

    if (!id || Number.isNaN(designationId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid designation ID is required"));
      return;
    }

    const existingDesignation = await getDesignationById(designationId);
    if (!existingDesignation) {
      res.status(404).json(new ApiError(404, "Designation not found"));
      return;
    }

    await deleteDesignation(designationId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Designation deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
