import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { NextFunction, Request, Response } from "express";
import {
    createStudentPaper,
    getAllStudentPapers,
    findStudentPaperById,
    updateStudentPaper,
    deleteStudentPaper
} from "../services/studentPaper.service.js";

export const getStudentPapers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { rollNumber } = req.query;

        if (!rollNumber) {
            res.status(400).json(new ApiError(400, "Please provide the valid `rollNumber`"));
            return;
        }

        console.log(rollNumber)

        // await findStudentPapersByRollNumber(rollNumber as string);

        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Student papers fetched successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
}

// --- CRUD Controllers ---
export const createStudentPaperController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentPaper = await createStudentPaper(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", studentPaper, "Student paper created successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllStudentPapersController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentPapers = await getAllStudentPapers();
        res.status(200).json(new ApiResponse(200, "SUCCESS", studentPapers, "Student papers fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getStudentPaperByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const studentPaper = await findStudentPaperById(id);
        if (!studentPaper) {
            res.status(404).json(new ApiResponse(404, "FAIL", null, "Student paper not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", studentPaper, "Student paper fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateStudentPaperController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const studentPaper = await updateStudentPaper(id, req.body);
        if (!studentPaper) {
            res.status(404).json(new ApiResponse(404, "FAIL", null, "Student paper not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", studentPaper, "Student paper updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteStudentPaperController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteStudentPaper(id);
        if (!deleted) {
            res.status(404).json(new ApiResponse(404, "FAIL", null, "Student paper not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Student paper deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};