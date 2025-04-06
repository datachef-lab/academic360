import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { NextFunction, Request, Response } from "express";
import { findStudentPapersByRollNumber, findStudents } from "../services/studentPaper.service.js";

export const getStudentPapers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { rollNumber } = req.query;

        if (!rollNumber) {
            res.status(400).json(new ApiError(400, "Please provide the valid `rollNumber`"));
            return;
        }

        console.log(rollNumber)

        await findStudentPapersByRollNumber(rollNumber as string);

        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Student papers fetched successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
}