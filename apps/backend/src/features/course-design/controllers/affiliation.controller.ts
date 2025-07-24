import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { createAffiliation, getAffiliationById, getAllAffiliations, updateAffiliation, deleteAffiliation } from "@/features/course-design/services/affiliation.service.js";

export const createAffiliationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createAffiliation(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Affiliation created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAffiliationByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const affiliation = await getAffiliationById(id);
        if (!affiliation) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Affiliation with ID ${id} not found`));
        res.status(200).json(new ApiResponse(200, "SUCCESS", affiliation, "Affiliation fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllAffiliationsHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const affiliations = await getAllAffiliations();
        res.status(200).json(new ApiResponse(200, "SUCCESS", affiliations, "All affiliations fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateAffiliationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const updated = await updateAffiliation(id, req.body);
        if (!updated) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Affiliation not found"));
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Affiliation updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteAffiliationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const deleted = await deleteAffiliation(id);
        if (!deleted) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Affiliation not found"));
        res.status(200).json(new ApiResponse(200, "DELETED", deleted, "Affiliation deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
}; 