import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import { loadBatchPapers, createBatchPaper, getAllBatchPapers, findBatchPaperById, updateBatchPaper, deleteBatchPaper } from "../services/batchPaper.service.js";

// import { loadPaperSubjects } from "../services/batchPaper.service.js";


export const oldBatchesPapers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await loadBatchPapers();
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Loaded old paper subjects"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const createBatchPaperController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const batchPaper = await createBatchPaper(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", batchPaper, "Batch paper created successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllBatchPapersController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const batchPapers = await getAllBatchPapers();
        res.status(200).json(new ApiResponse(200, "SUCCESS", batchPapers, "Batch papers fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getBatchPaperByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const batchPaper = await findBatchPaperById(id);
        if (!batchPaper) {
            res.status(404).json(new ApiResponse(404, "FAIL", null, "Batch paper not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", batchPaper, "Batch paper fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateBatchPaperController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const batchPaper = await updateBatchPaper(id, req.body);
        if (!batchPaper) {
            res.status(404).json(new ApiResponse(404, "FAIL", null, "Batch paper not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", batchPaper, "Batch paper updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteBatchPaperController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteBatchPaper(id);
        if (!deleted) {
            res.status(404).json(new ApiResponse(404, "FAIL", null, "Batch paper not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Batch paper deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};