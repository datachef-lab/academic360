import { Request, Response, NextFunction } from "express";
import { addHealth, findHealthById, findHealthByStudentId, removeHealth, removeHealthByStudentId } from "../services/health.service.js";
import { HealthType } from "@/types/user/health.js";

/**
 * Helper function to sanitize health data
 */
const sanitizeHealthData = (data: any): any => {
  // Extract data without date fields
  const { createdAt, updatedAt, bloodGroup, ...healthData } = data;
  
  // Handle blood group if present, removing any problematic date fields
  let sanitizedBloodGroup = null;
  if (bloodGroup) {
    const { createdAt: bgCreatedAt, updatedAt: bgUpdatedAt, ...bgData } = bloodGroup;
    sanitizedBloodGroup = bgData;
  }
  
  return {
    ...healthData,
    bloodGroup: sanitizedBloodGroup,
    // Set fresh dates for createAt/updatedAt if operation is creating a new record
    ...(data.id ? { } : { createdAt: new Date(), updatedAt: new Date() }),
    // Always update the updatedAt timestamp
    updatedAt: new Date()
  };
};

/**
 * Create a new health record
 */
export const createHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const healthData: HealthType = sanitizeHealthData(req.body);
    
    // Check if health record already exists for this student
    if (healthData.studentId) {
      const existingHealth = await findHealthByStudentId(healthData.studentId);
      
      // If exists, update it instead of creating new
      if (existingHealth) {
        console.log(`Health record already exists for student ${healthData.studentId}, updating instead of creating`);
        
        // Call the update method instead
        await removeHealth(existingHealth.id!);
        const updatedHealth = await addHealth({ ...healthData, id: existingHealth.id! });
        
        res.status(200).json({
          success: true,
          message: "Health record updated successfully",
          payload: updatedHealth
        });
        return;
      }
    }
    
    // Continue with normal create if no existing record
    const createdHealth = await addHealth(healthData);
    
    if (createdHealth) {
      res.status(201).json({
        success: true,
        message: "Health record created successfully",
        payload: createdHealth
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to create health record",
        payload: null
      });
    }
  } catch (error) {
    console.error("Error in health controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null
    });
  }
};

/**
 * Get health record by ID
 */
export const getHealthById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid ID format",
        payload: null
      });
      return;
    }
    
    const health = await findHealthById(id);
    if (health) {
      res.status(200).json({
        success: true,
        message: "Health record retrieved successfully",
        payload: health
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Health record not found",
        payload: null
      });
    }
  } catch (error) {
    console.error("Error in health controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null
    });
  }
};

/**
 * Get health record by student ID
 */
export const getHealthByStudentId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = parseInt(req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid student ID format",
        payload: null
      });
      return;
    }
    
    const health = await findHealthByStudentId(studentId);
    if (health) {
      res.status(200).json({
        success: true,
        message: "Health record retrieved successfully",
        payload: health
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Health record not found for this student",
        payload: null
      });
    }
  } catch (error) {
    console.error("Error in health controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null
    });
  }
};

/**
 * Update health record
 */
export const updateHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    console.log("Health data received for update:", req.body);
    
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid ID format",
        payload: null
      });
      return;
    }
    
    // Sanitize the health data to fix timestamp issues
    const healthData: HealthType = sanitizeHealthData({ 
      ...req.body, 
      id, // Ensure ID is included
      updatedAt: new Date() // Always refresh updatedAt
    });
    
    const existingHealth = await findHealthById(id);
    
    if (!existingHealth) {
      res.status(404).json({
        success: false,
        message: "Health record not found",
        payload: null
      });
      return;
    }
    
    try {
      await removeHealth(id);
      const updatedHealth = await addHealth(healthData);
      
      res.status(200).json({
        success: true,
        message: "Health record updated successfully",
        payload: updatedHealth
      });
    } catch (error) {
      console.error("Error updating health record:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update health record",
        payload: null
      });
    }
  } catch (error) {
    console.error("Error in health controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null
    });
  }
};

/**
 * Delete health record
 */
export const deleteHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid ID format",
        payload: null
      });
      return;
    }
    
    const result = await removeHealth(id);
    
    if (result === null) {
      res.status(404).json({
        success: false,
        message: "Health record not found",
        payload: null
      });
      return;
    }
    
    if (result === false) {
      res.status(400).json({
        success: false,
        message: "Failed to delete health record",
        payload: null
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: "Health record deleted successfully",
      payload: null
    });
  } catch (error) {
    console.error("Error in health controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null
    });
  }
};

/**
 * Delete health record by student ID
 */
export const deleteHealthByStudentId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = parseInt(req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid student ID format",
        payload: null
      });
      return;
    }
    
    const result = await removeHealthByStudentId(studentId);
    
    if (result === null) {
      res.status(404).json({
        success: false,
        message: "Health record not found for this student",
        payload: null
      });
      return;
    }
    
    if (result === false) {
      res.status(400).json({
        success: false,
        message: "Failed to delete health record",
        payload: null
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: "Health record deleted successfully",
      payload: null
    });
  } catch (error) {
    console.error("Error in health controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      payload: null
    });
  }
};
