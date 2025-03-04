import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { NextFunction, Request, Response } from "express";
import { findStudentPapersByRollNumber, findStudents } from "../services/studentPaper.service.js";

export const getStudentPapers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { streamId, rollNumber } = req.query;

        if (!streamId || !rollNumber) {
            res.status(400).json(new ApiError(400, "Please provide the valid `streamId` and `rollNumber`"));
            return;
        }

        console.log(streamId, rollNumber)

        await findStudents();

        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Student papers fetched successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
}