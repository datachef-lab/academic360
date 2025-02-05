import { Request, Response, NextFunction } from "express";
import { 
    createAcademicHistoryService, 
    getAcademicHistoryByIdService, 
    getAllAcademicHistoryService, 
    updateAcademicHistoryService, 
    deleteAcademicHistoryService 
} from "../services/academicHistory.service.ts";
import { createAcademicHistorySchema } from "../models/academicHistory.model.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";

export const createAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = createAcademicHistorySchema.parse(req.body);
        const records = await createAcademicHistoryService(validatedData);
        res.status(201).json(new ApiResponse(201, "SUCCESS", records, "New academicHistory is added to db!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;
        const records = await getAcademicHistoryByIdService(Number(id));
        if (!records.length) {
            return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicHistory of ID ${id} not found`));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched academicHistory successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await getAllAcademicHistoryService();
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all academicHistory!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const validatedData = createAcademicHistorySchema.parse(req.body);
        const records = await updateAcademicHistoryService(Number(id), validatedData);
        if (!records.length) {
            return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "academicHistory not found"));
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", records, `academicHistory of ID ${id} updated successfully`));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const deletedRecord = await deleteAcademicHistoryService(Number(id));
        if (!deletedRecord.length) {
            return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "academicHistory not found"));
        }
        res.status(200).json(new ApiResponse(200, "DELETED", deletedRecord, `academicHistory of ID ${id} deleted successfully`));
    } catch (error) {
        handleError(error, res, next);
    }
};
