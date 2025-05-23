import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import { loadPaperSubjects } from "../services/batchPaper.service.js";


export const oldBatchesPapers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await loadPaperSubjects();
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Loaded old paper subjects"));
    } catch (error) {
        handleError(error, res, next);
    }
}