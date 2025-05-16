import { NextFunction, Request, Response } from "express";
import { addPersonalDetails, findPersonalDetailsById, findPersonalDetailsByStudentId, savePersonalDetails, removePersonalDetails, removePersonalDetailsByStudentId } from "../services/personalDetails.service.js";
import { PersonalDetailsType } from "@/types/user/personal-details.js";
import { ApiResponse, handleError } from "@/utils/index.js";

/**
 * Helper function to sanitize personal details data and handle date fields properly
 */
const sanitizePersonalData = (data: any): any => {
  if (!data) return data;
  
  const sanitizedData = { ...data };
  
  // Handle date fields at the top level
  if (sanitizedData.createdAt && !(sanitizedData.createdAt instanceof Date)) {
    sanitizedData.createdAt = new Date();
  }
  
  if (sanitizedData.updatedAt && !(sanitizedData.updatedAt instanceof Date)) {
    sanitizedData.updatedAt = new Date();
  }
  
  // Handle nested objects like address, etc.
  Object.keys(sanitizedData).forEach(key => {
    if (sanitizedData[key] && typeof sanitizedData[key] === 'object') {
      if (sanitizedData[key].createdAt && !(sanitizedData[key].createdAt instanceof Date)) {
        delete sanitizedData[key].createdAt;
      }
      if (sanitizedData[key].updatedAt && !(sanitizedData[key].updatedAt instanceof Date)) {
        delete sanitizedData[key].updatedAt;
      }
    }
  });
  
  return sanitizedData;
};

export const createPersonalDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sanitizedData = sanitizePersonalData(req.body);
        console.log("Sanitized data for create:", sanitizedData);
        const newPersonDetails = await addPersonalDetails(sanitizedData as PersonalDetailsType);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newPersonDetails, "New Personal-Details is added to db!"));

    } catch (error) {
        console.error("Error creating personal details:", error);
        handleError(error, res, next);
    }
};

export const getPersonalDetailsById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const foundPersonalDetails = await findPersonalDetailsById(Number(id));

        if (!foundPersonalDetails) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Personal Details of ID ${id} not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundPersonalDetails, "Personal details fetched successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getPersonalDetailsByStudentId = async (req: Request, res: Response, next: NextFunction) => {
    const { studentId } = req.params;
    try {
        const foundPersonalDetails = await findPersonalDetailsByStudentId(Number(studentId));
        
        if (!foundPersonalDetails) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Personal Details of Student-ID ${studentId} not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundPersonalDetails, "Personal details fetched successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const updatePersonalDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const sanitizedData = sanitizePersonalData(req.body);
        console.log("Sanitized data for update:", sanitizedData);
        
        const updatedDetails = await savePersonalDetails(Number(id), sanitizedData as PersonalDetailsType);

        if (!updatedDetails) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Personal Details with ID ${id} not found`));
            return;
        }

        res.status(200).json(new ApiResponse(200, "UPDATED", updatedDetails, "Personal details updated successfully"));

    } catch (error) {
        console.error("Error updating personal details:", error);
        handleError(error, res, next);
    }
};

export const deletePersonalDetailsById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isDeleted = await removePersonalDetails(Number(id));

        if (isDeleted === null) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Personal Details with ID ${id} not found`));
            return;
        }

        if (!isDeleted) {
            res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete personal details"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "DELETED", null, "Personal details deleted successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const deletePersonalDetailsByStudentId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { studentId } = req.params;
        const isDeleted = await removePersonalDetailsByStudentId(Number(studentId));

        if (isDeleted === null) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Personal Details for student ID ${studentId} not found`));
            return;
        }

        if (!isDeleted) {
            res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete personal details"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "DELETED", null, "Personal details deleted successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};