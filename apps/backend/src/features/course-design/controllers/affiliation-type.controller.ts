import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { 
  createAffiliationType, 
  getAffiliationTypeById, 
  getAllAffiliationTypes, 
  updateAffiliationType, 
  deleteAffiliationType, 
  bulkUploadAffiliationTypes 
} from "@/features/course-design/services/affiliation-type.service";

export const createAffiliationTypeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createAffiliationType(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Affiliation type created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAffiliationTypeByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const affiliationType = await getAffiliationTypeById(id);
        if (!affiliationType) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Affiliation type with ID ${id} not found`));
        res.status(200).json(new ApiResponse(200, "SUCCESS", affiliationType, "Affiliation type fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllAffiliationTypesHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const affiliationTypes = await getAllAffiliationTypes();
        res.status(200).json(new ApiResponse(200, "SUCCESS", affiliationTypes, "All affiliation types fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateAffiliationTypeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const updated = await updateAffiliationType(id, req.body);
        if (!updated) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Affiliation type not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Affiliation type updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteAffiliationTypeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteAffiliationType(id);
        if (!deleted) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Affiliation type not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "DELETED", deleted, "Affiliation type deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const bulkUploadAffiliationTypesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const result = await bulkUploadAffiliationTypes(req.file.path);
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Bulk upload completed"));
    return 
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    handleError(error, res, next);
  }
};
