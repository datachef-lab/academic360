import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { createStream, getStreamById, getAllStreams, updateStream, deleteStreamSafe, bulkUploadStreams } from "@/features/course-design/services/stream.service.js";

export const createStreamHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createStream(req.body);
        if (!created) {
            res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Stream already exists"));
            return 
        }
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Stream created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const bulkUploadStreamsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            res.status(400).json(new ApiResponse(400, "ERROR", null, "No file uploaded"));
            return;
        }

        const result = await bulkUploadStreams(req.file.path);
        
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

export const getStreamByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const stream = await getStreamById(id);
        if (!stream) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Stream with ID ${id} not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", stream, "Stream fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllStreamsHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const streams = await getAllStreams();
        res.status(200).json(new ApiResponse(200, "SUCCESS", streams, "All streams fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateStreamHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = Number(req.query.id || req.params.id);
        const updated = await updateStream(id, req.body);
        if (!updated) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Stream not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Stream updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteStreamHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const result = await deleteStreamSafe(id);
        if (!result) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Stream not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "DELETED", result as any, (result as any).message ?? ""));
    } catch (error) {
        handleError(error, res, next);
    }
}; 
