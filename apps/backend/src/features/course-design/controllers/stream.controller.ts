import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { createStream, getStreamById, getAllStreams, updateStream, deleteStream } from "@/features/course-design/services/stream.service.js";

export const createStreamHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createStream(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Stream created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getStreamByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const stream = await getStreamById(id);
        if (!stream) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Stream with ID ${id} not found`));
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

export const updateStreamHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const updated = await updateStream(id, req.body);
        if (!updated) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Stream not found"));
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Stream updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteStreamHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const deleted = await deleteStream(id);
        if (!deleted) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Stream not found"));
        res.status(200).json(new ApiResponse(200, "DELETED", deleted, "Stream deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
}; 