import { Request, Response, NextFunction } from "express";
import { handleError } from "@/utils/handleError.ts";

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Logic for creating a single student
    } catch (error) {
        handleError(error, res, next);
    }
};