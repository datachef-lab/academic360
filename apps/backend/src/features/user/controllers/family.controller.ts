import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { 
  addFamily, 
  findFamilyById, 
  findFamilyByStudentId, 
  saveFamily, 
  removeFamily, 
  removeFamilysByStudentId 
} from "../services/family.service.js";
import { FamilyType } from "@/types/user/family.js";

/**
 * Helper function to sanitize family data and handle date fields properly
 */
const sanitizeFamilyData = (data: any): any => {
  // Helper function to sanitize nested objects
  const sanitizeNestedObject = (obj: any) => {
    if (!obj) return obj;
    
    // Remove date properties that might cause issues
    const { createdAt, updatedAt, ...rest } = obj;
    
    // For nested objects like qualification, occupation, etc.
    Object.keys(rest).forEach(key => {
      if (rest[key] && typeof rest[key] === 'object') {
        rest[key] = sanitizeNestedObject(rest[key]);
      }
    });
    
    return rest;
  };
  
  // Process all possible nested objects
  const sanitizedData = { ...data };
  
  if (sanitizedData.fatherDetails) {
    sanitizedData.fatherDetails = sanitizeNestedObject(sanitizedData.fatherDetails);
  }
  
  if (sanitizedData.motherDetails) {
    sanitizedData.motherDetails = sanitizeNestedObject(sanitizedData.motherDetails);
  }
  
  if (sanitizedData.guardianDetails) {
    sanitizedData.guardianDetails = sanitizeNestedObject(sanitizedData.guardianDetails);
  }
  
  if (sanitizedData.annualIncome) {
    sanitizedData.annualIncome = sanitizeNestedObject(sanitizedData.annualIncome);
  }
  
  // Remove top-level date fields and add fresh ones
  const { createdAt, updatedAt, ...restData } = sanitizedData;
  
  return {
    ...restData,
    updatedAt: new Date(),
    ...(data.id ? {} : { createdAt: new Date() })
  };
};

// Create a new family record
export const createFamily = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sanitizedData = sanitizeFamilyData(req.body);
        const newFamily = await addFamily(sanitizedData as FamilyType);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newFamily, "New Family is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

// Get family by ID
export const getFamilyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const foundFamily = await findFamilyById(Number(id));

        if (!foundFamily) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Family with ID ${id} not found`));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", foundFamily, "Fetched Family successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

// Get family by student ID
export const getFamilyByStudentId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { studentId } = req.params;

        const foundFamily = await findFamilyByStudentId(Number(studentId));

        if (!foundFamily) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Family for student ID ${studentId} not found`));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", foundFamily, "Fetched Family successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

// Update an existing family record
export const updateFamily = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        console.log("Original request body:", req.body);
        
        // Sanitize the data to fix timestamp issues
        const sanitizedData = sanitizeFamilyData(req.body);
        console.log("Sanitized data:", sanitizedData);

        const updatedFamily = await saveFamily(Number(id), sanitizedData as FamilyType);

        if (!updatedFamily) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Family not found"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "UPDATED", updatedFamily, "Family updated successfully"));

    } catch (error) {
        console.error("Error updating family:", error);
        handleError(error, res, next);
    }
};

// Delete a family record by ID
export const deleteFamilyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const isDeleted = await removeFamily(Number(id));

        if (isDeleted === null) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Family with ID ${id} not found`));
            return;
        }

        if (!isDeleted) {
            res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete family record"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "DELETED", null, "Family deleted successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete family record by student ID
export const deleteFamilyByStudentId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { studentId } = req.params;

        const isDeleted = await removeFamilysByStudentId(Number(studentId));

        if (isDeleted === null) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Family for student ID ${studentId} not found`));
            return;
        }

        if (!isDeleted) {
            res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete family record"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "DELETED", null, "Family deleted successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};
