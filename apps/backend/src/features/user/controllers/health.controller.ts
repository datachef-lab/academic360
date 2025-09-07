import { Request, Response, NextFunction } from "express";
import {
  addHealth,
  findHealthById,
  findHealthByStudentId,
  updateHealth,
  removeHealth,
  removeHealthByStudentId,
  getAllHealths,
} from "../services/health.service.js";
import { createHealthSchema } from "@repo/db/schemas/models/user";
import { HealthType } from "@/types/user/health.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";

// Create a new health record
export const createHealth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parseResult = createHealthSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: JSON.stringify(parseResult.error.flatten()),
        payload: null,
      });
      return;
    }
    const healthData: HealthType = req.body;
    // Check if health record already exists for this student
    // if (healthData.studentId) {
    //   const existingHealth = await findHealthByStudentId(healthData.studentId);
    //   if (existingHealth) {
    //     // If exists, update it instead of creating new
    //     const updatedHealth = await updateHealth(existingHealth.id!, { ...healthData, id: existingHealth.id! });
    //     res.status(200).json({ success: true, message: "Health record updated successfully", payload: updatedHealth });
    //     return;
    //   }
    // }
    // Continue with normal create if no existing record
    const createdHealth = await addHealth(healthData);
    if (createdHealth) {
      res.status(201).json({
        success: true,
        message: "Health record created successfully",
        payload: createdHealth,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to create health record",
        payload: null,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null,
    });
  }
};

// Get health record by ID
export const getHealthById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid ID format", payload: null });
      return;
    }
    const health = await findHealthById(id);
    if (health) {
      res.status(200).json({
        success: true,
        message: "Health record retrieved successfully",
        payload: health,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Health record not found",
        payload: null,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null,
    });
  }
};

// Get health record by student ID
export const getHealthByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentId = parseInt(req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid student ID format",
        payload: null,
      });
      return;
    }
    const health = await findHealthByStudentId(studentId);
    if (health) {
      res.status(200).json({
        success: true,
        message: "Health record retrieved successfully",
        payload: health,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Health record not found for this student",
        payload: null,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null,
    });
  }
};

// Update health record
export const updateHealthController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid ID format", payload: null });
      return;
    }
    const parseResult = createHealthSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: JSON.stringify(parseResult.error.flatten()),
        payload: null,
      });
      return;
    }
    const healthData: HealthType = { ...req.body, id };
    const existingHealth = await findHealthById(id);
    if (!existingHealth) {
      res.status(404).json({
        success: false,
        message: "Health record not found",
        payload: null,
      });
      return;
    }
    const updatedHealth = await updateHealth(id, healthData);
    res.status(200).json({
      success: true,
      message: "Health record updated successfully",
      payload: updatedHealth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null,
    });
  }
};

export { updateHealthController as updateHealth };

// Delete health record by ID
export const deleteHealth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid ID format", payload: null });
      return;
    }
    const result = await removeHealth(id);
    if (result === null) {
      res.status(404).json({
        success: false,
        message: "Health record not found",
        payload: null,
      });
      return;
    }
    if (result === false) {
      res.status(400).json({
        success: false,
        message: "Failed to delete health record",
        payload: null,
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Health record deleted successfully",
      payload: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null,
    });
  }
};

// Delete health record by student ID
export const deleteHealthByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentId = parseInt(req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid student ID format",
        payload: null,
      });
      return;
    }
    const result = await removeHealthByStudentId(studentId);
    if (result === null) {
      res.status(404).json({
        success: false,
        message: "Health record not found for this student",
        payload: null,
      });
      return;
    }
    if (result === false) {
      res.status(400).json({
        success: false,
        message: "Failed to delete health record",
        payload: null,
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Health record deleted successfully",
      payload: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null,
    });
  }
};

export const getAllHealthsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const healths = await getAllHealths();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          healths,
          "Fetched all health records successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
