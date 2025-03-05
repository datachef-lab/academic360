import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";

import { AcademicHistoryType } from "@/types/user/academic-history.js";
import { addAcademicHistory, findAcademicHistoryById, findAcademicHistoryByStudentId, findAllAcademicHistory, removeAcademicHistory, saveAcademicHistory } from "@/features/user/services/academicHistory.service.js";
// gwrgwrgw
export const createAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newAcadeicHistory = await addAcademicHistory(req.body as AcademicHistoryType);;
        res.status(201).json(new ApiResponse(201, "SUCCESS", newAcadeicHistory, "New academicHistory is added to db!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAcademicHistoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        
        const foundAcademicHistory = await findAcademicHistoryById(Number(id));
        
        if (!foundAcademicHistory) {
            return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicHistory of ID ${id} not found`));
        }
        
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundAcademicHistory, "Fetched academicHistory successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAcademicHistoryByStudentId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { studentId } = req.query;

        
        const foundAcademicHistory = await findAcademicHistoryByStudentId(Number(studentId));
        
        if (!foundAcademicHistory) {
            return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicHistory of studentId ${studentId} not found`));
        }
        
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundAcademicHistory, "Fetched academicHistory successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};
export const getAllAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const academicHistories = await findAllAcademicHistory(1, 10);
        res.status(200).json(new ApiResponse(200, "SUCCESS", academicHistories, "Fetched all academicHistory!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        
        const updatedAcademicHistory = await saveAcademicHistory(+id, req.body as AcademicHistoryType);
        
        if (!updatedAcademicHistory) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "academicHistory not found"));
            return;
        }
        
        res.status(200).json(new ApiResponse(200, "UPDATED", updatedAcademicHistory, `academicHistory of ID ${id} updated successfully`));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        
        const deletedAcademicHistory = await removeAcademicHistory(+id);

        if (!deletedAcademicHistory) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "academicHistory not found"));
            return;
        }
        
        res.status(200).json(new ApiResponse(200, "DELETED", deletedAcademicHistory, `academicHistory of ID ${id} deleted successfully`));

    } catch (error) {
        handleError(error, res, next);
    }
};
