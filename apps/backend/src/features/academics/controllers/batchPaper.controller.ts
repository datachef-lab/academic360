import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import { loadBatchPapers } from "../services/batchPaper.service";

// import { loadPaperSubjects } from "../services/batchPaper.service.js";


export const oldBatchesPapers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await loadBatchPapers();
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Loaded old paper subjects"));
    } catch (error) {
        handleError(error, res, next);
    }
}