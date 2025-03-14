import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import { loadOlderBatches } from "../services/batch.service.js";

export const oldBatches = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await loadOlderBatches();
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Loaded old data"));
    } catch (error) {
        handleError(error, res, next);
    }
}