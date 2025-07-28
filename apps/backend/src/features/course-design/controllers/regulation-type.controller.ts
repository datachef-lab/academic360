import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { 
  createRegulationType, 
  getRegulationTypeById, 
  getAllRegulationTypes, 
  updateRegulationType, 
  deleteRegulationType, 
  bulkUploadRegulationTypes 
} from "@/features/course-design/services/regulation-type.service.js";

export const createRegulationTypeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createRegulationType(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Regulation type created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getRegulationTypeByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const regulationType = await getRegulationTypeById(id);
        if (!regulationType) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Regulation type with ID ${id} not found`));
        res.status(200).json(new ApiResponse(200, "SUCCESS", regulationType, "Regulation type fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllRegulationTypesHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const regulationTypes = await getAllRegulationTypes();
        res.status(200).json(new ApiResponse(200, "SUCCESS", regulationTypes, "All regulation types fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateRegulationTypeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const updated = await updateRegulationType(id, req.body);
        if (!updated) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Regulation type not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Regulation type updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteRegulationTypeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteRegulationType(id);
        if (!deleted) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Regulation type not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "DELETED", deleted, "Regulation type deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const bulkUploadRegulationTypesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const result = await bulkUploadRegulationTypes(req.file.path);
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Bulk upload completed"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    handleError(error, res, next);
  }
};
