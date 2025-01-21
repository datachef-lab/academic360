import { NextFunction, Response } from "express";
import { ApiError } from "./ApiError.ts";

export const handleError = (error: unknown, res: Response, next?: NextFunction) => {
    if (typeof error === "object" && error !== null && "code" in error) {
        const dbError = error as { code: string; message: string };

        if (dbError.code === "23505") {
            res.status(409).json(new ApiError(409, `Duplicate entry: Please enter a valid record`));
        } else {
            res.status(500).json(new ApiError(500, `Database Error: ${dbError.message}`));
        }
    } else if (error instanceof Error) {
        if (error.message.includes("validation")) {
            res.status(400).json(new ApiError(400, `Validation Error: ${error.message}`));
        } else if (error.message.includes("Unauthorized") || error instanceof Error && error.name === "TokenExpiredError") {
            res.status(401).json(new ApiError(401, error.message));
        } else if (error.message.includes("Forbidden")) {
            res.status(403).json(new ApiError(403, `Forbidden: ${error.message}`));
        } else if (error.message.includes("Too Many Requests")) {
            res.status(429).json(new ApiError(429, `Too Many Requests: ${error.message}`));
        } else {
            res.status(500).json(new ApiError(500, `Unexpected Error: ${error.message}`));
        }
    } else {
        res.status(500).json(new ApiError(500, `Unknown Error: An unexpected error occurred`));
    }

    if (next) next(error);
};
