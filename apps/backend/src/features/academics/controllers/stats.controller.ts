import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { getDashboardStats } from "../services/stats.service.js";

export const getDashboardStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const stats = await getDashboardStats();
        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    stats,
                    "Dashboard statistics fetched successfully."
                )
            );
    } catch (error) {
        handleError(error, res, next);
    }
}; 