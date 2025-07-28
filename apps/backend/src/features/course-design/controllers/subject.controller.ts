import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { createSubject, getSubjectById, getAllSubjects, updateSubject, deleteSubject, bulkUploadSubjects } from "@/features/course-design/services/subject.service.js";

export const createSubjectHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createSubject(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Subject created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const bulkUploadSubjectsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            res.status(400).json(new ApiResponse(400, "ERROR", null, "No file uploaded"));
            return;
        }

        const result = await bulkUploadSubjects(req.file.path);
        
        const response = {
            success: result.success,
            errors: result.errors,
            summary: {
                total: result.success.length + result.errors.length,
                successful: result.success.length,
                failed: result.errors.length
            }
        };

        res.status(200).json(new ApiResponse(200, "SUCCESS", response, "Bulk upload completed"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getSubjectByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const subject = await getSubjectById(id);
        if (!subject) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Subject with ID ${id} not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", subject, "Subject fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllSubjectsHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const subjects = await getAllSubjects();
        res.status(200).json(new ApiResponse(200, "SUCCESS", subjects, "All subjects fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateSubjectHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const updated = await updateSubject(id, req.body);
        if (!updated) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Subject not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Subject updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteSubjectHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const deleted = await deleteSubject(id);
        if (!deleted) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Subject not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "DELETED", deleted, "Subject deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
}; 
