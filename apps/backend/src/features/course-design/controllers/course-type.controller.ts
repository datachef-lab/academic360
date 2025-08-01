import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { createCourseType, getCourseTypeById, getAllCourseTypes, updateCourseType, deleteCourseType, bulkUploadCourseTypes } from "@/features/course-design/services/course-type.service.js";
import { socketService } from "@/services/socketService.js";

export const createCourseTypeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createCourseType(req.body);
        if (!created) {
            res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Course type already exists"));
            return 
        }
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Course type created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const bulkUploadCourseTypesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            res.status(400).json(new ApiResponse(400, "ERROR", null, "No file uploaded"));
            return;
        }
        const uploadSessionId = req.body.uploadSessionId || req.query.uploadSessionId;
        const io = socketService.getIO();
        const result = await bulkUploadCourseTypes(req.file.path, io, uploadSessionId);
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

export const getCourseTypeByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const courseType = await getCourseTypeById(id);
        if (!courseType) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Course type with ID ${id} not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", courseType, "Course type fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllCourseTypesHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const courseTypes = await getAllCourseTypes();
        res.status(200).json(new ApiResponse(200, "SUCCESS", courseTypes, "All course types fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateCourseTypeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const updated = await updateCourseType(id, req.body);
        if (!updated) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course type not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Course type updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteCourseTypeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const deleted = await deleteCourseType(id);
        if (!deleted) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course type not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "DELETED", deleted, "Course type deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
}; 
