import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { createPaper, getPaperById, getAllPapers, updatePaper, deletePaper } from "@/features/course-design/services/paper.service.js";

export const createPaperHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const created = await createPaper(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", created, "Paper created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getPaperByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const paper = await getPaperById(id);
        if (!paper) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Paper with ID ${id} not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", paper, "Paper fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllPapersHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const papers = await getAllPapers();
        res.status(200).json(new ApiResponse(200, "SUCCESS", papers, "All papers fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updatePaperHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const updated = await updatePaper(id, req.body);
        if (!updated) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Paper not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updated, "Paper updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deletePaperHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.query.id || req.params.id);
        const deleted = await deletePaper(id);
        if (!deleted) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Paper not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "DELETED", deleted, "Paper deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
}; 
