import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { createTopic, getTopicById, getAllTopics, updateTopic, deleteTopic } from "@/features/course-design/services/topic.service.js";

export const createTopicHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createTopic(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Topic created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getTopicByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const topic = await getTopicById(id);
        if (!topic) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Topic with ID ${id} not found`));
        res.status(200).json(new ApiResponse(200, "SUCCESS", topic, "Topic fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllTopicsHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const topics = await getAllTopics();
        res.status(200).json(new ApiResponse(200, "SUCCESS", topics, "All topics fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateTopicHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const updated = await updateTopic(id, req.body);
        if (!updated) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Topic not found"));
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Topic updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteTopicHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const deleted = await deleteTopic(id);
        if (!deleted) return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Topic not found"));
        res.status(200).json(new ApiResponse(200, "DELETED", deleted, "Topic deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
}; 
