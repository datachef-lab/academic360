import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  addFamily,
  findFamilyById,
  findFamilyByStudentId,
  saveFamily,
  removeFamily,
  removeFamilysByStudentId,
  getAllFamilies,
} from "../services/family.service.js";
import { createFamilySchema } from "@repo/db/schemas/models/user";
import { FamilyType } from "@/types/user/family.js";

// Create a new family record
export const createFamily = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parseResult = createFamilySchema.safeParse(req.body);
    if (!parseResult.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parseResult.error.flatten()),
          ),
        );
      return;
    }
    const newFamily = await addFamily(req.body as FamilyType);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newFamily,
          "New Family is added to db!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get family by ID
export const getFamilyById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const foundFamily = await findFamilyById(Number(id));
    if (!foundFamily) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Family with ID ${id} not found`,
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          foundFamily,
          "Fetched Family successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get family by student ID
export const getFamilyByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const foundFamily = await findFamilyByStudentId(Number(studentId));
    if (!foundFamily) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Family for student ID ${studentId} not found`,
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          foundFamily,
          "Fetched Family successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update an existing family record
export const updateFamily = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    // const parseResult = createFamilySchema.safeParse(req.body);
    // if (!parseResult.success) {
    //   res.status(400).json(new ApiResponse(400, "VALIDATION_ERROR", null, JSON.stringify(parseResult.error.flatten())));
    //   return;
    // }
    const updatedFamily = await saveFamily(Number(id), req.body as FamilyType);
    if (!updatedFamily) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Family not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updatedFamily,
          "Family updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete a family record by ID
export const deleteFamilyById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const isDeleted = await removeFamily(Number(id));
    if (isDeleted === null) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Family with ID ${id} not found`,
          ),
        );
      return;
    }
    if (!isDeleted) {
      res
        .status(500)
        .json(
          new ApiResponse(500, "ERROR", null, "Failed to delete family record"),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "DELETED", null, "Family deleted successfully"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete family record by student ID
export const deleteFamilyByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const isDeleted = await removeFamilysByStudentId(Number(studentId));
    if (isDeleted === null) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Family for student ID ${studentId} not found`,
          ),
        );
      return;
    }
    if (!isDeleted) {
      res
        .status(500)
        .json(
          new ApiResponse(500, "ERROR", null, "Failed to delete family record"),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "DELETED", null, "Family deleted successfully"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllFamiliesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const families = await getAllFamilies();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          families,
          "Fetched all families successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
