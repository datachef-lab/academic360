import { NextFunction, Request, Response } from "express";
import * as sessionService from "../services/session.service.js";
import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { Session } from "../models/session.model.js";

export const createSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newSession = await sessionService.create(req.body as Session);
        if (!newSession) {
            res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Session already exists"));
            return;
        }
        res.status(201).json(new ApiResponse(201, "SUCCESS", newSession, "Session created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getAllSessionsHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const sessions = await sessionService.findAll();
        res.status(200).json(new ApiResponse(200, "SUCCESS", sessions, "All sessions fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionId = parseInt(req.params.id);
        const updatedSession = await sessionService.update(sessionId, req.body);

        if (!updatedSession) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Session not found"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", updatedSession, "Session updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionId = parseInt(req.params.id);
        const deletedSession = await sessionService.deleteById(sessionId);

        if (!deletedSession) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Session not found"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Session deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};