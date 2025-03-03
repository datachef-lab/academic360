import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { NextFunction, Request, Response } from "express";
import { findStudentPapersByRollNumber } from "../services/studentPaper.service.js";

export const getStudentPapers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { streamId, rollNumber } = req.query;

        if (!streamId || !rollNumber) {
            res.status(400).json(new ApiError(400, "Please provide the valid `streamId` and `rollNumber`"));
            return;
        }

        const studentPapers = await findStudentPapersByRollNumber(Number(streamId), String(rollNumber));

        res.status(200).json(new ApiResponse(200, "SUCCESS", studentPapers, "Student papers fetched successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
}