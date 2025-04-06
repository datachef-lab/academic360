import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import { loadOlderBatches, refactorBatchSession } from "../services/batch.service.js";

export const oldBatches = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await loadOlderBatches();
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Loaded old data"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const refactorBatchSessionC = async (req: Request, res: Response, next: NextFunction) => {
    console.log("first")
    try {
        await refactorBatchSession();
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "refactorBatchSession"));
    } catch (error) {
        handleError(error, res, next);
    }
}