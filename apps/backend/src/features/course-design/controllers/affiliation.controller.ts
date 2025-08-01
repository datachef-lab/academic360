import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { createAffiliation, getAffiliationById, getAllAffiliations, updateAffiliation, deleteAffiliation, bulkUploadAffiliations } from "@/features/course-design/services/affiliation.service.js";
import { socketService } from "@/services/socketService.js";

export const createAffiliationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createAffiliation(req.body);
        if (!created) {
            res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Affiliation already exists"));
            return
        }
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Affiliation created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAffiliationByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
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
        const id = Number(req.params.id);
        const updated = await updateAffiliation(id, req.body);
        if (!updated) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Affiliation not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Affiliation updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteAffiliationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteAffiliation(id);
        if (!deleted) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Affiliation not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "DELETED", deleted, "Affiliation deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const bulkUploadAffiliationsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file || !req.file.path) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const uploadSessionId = req.body.uploadSessionId || req.query.uploadSessionId;
        const io = socketService.getIO();
        const result = await bulkUploadAffiliations(req.file.path, io, uploadSessionId);
        res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Bulk upload completed"));
        return;
    } catch (error: unknown) {
        handleError(error, res, next);
    }
}; 