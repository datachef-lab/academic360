import { NextFunction, Response } from "express";
import { ApiError } from "./ApiError.js";

export const handleError = (error: unknown, res: Response, next?: NextFunction) => {
    if (typeof error === "object" && error !== null && "code" in error) {
        const dbError = error as { code: string; message: string };

        if (dbError.code === "23505") {
            res.status(409).json(new ApiError(409, `Duplicate entry: A user with the same email already exists!`));
        } else {
            res.status(500).json(new ApiError(500, `Database Error: ${dbError.message}`));
        }
    } else if (error instanceof Error) {
        if (error.message.includes("validation")) {
            res.status(400).json(new ApiError(400, `Validation Error: ${error.message}`));
        } else {
            res.status(500).json(new ApiError(500, `Unexpected Error: ${error.message}`));
        }
    } else {
        res.status(500).json(new ApiError(500, `Unknown Error: An unexpected error occurred`));
    }

    if (next) next(error);
};