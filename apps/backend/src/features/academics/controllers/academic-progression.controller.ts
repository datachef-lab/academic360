import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import { findAcademicProgressionByUserId } from "../services/academic-progression.service.js";

// Get the logged-in student's semester-wise SGPA and marks (from marks360)
export const getMyAcademicProgressionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req.user as { id?: number } | undefined)?.id;
    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const progression = await findAcademicProgressionByUserId(userId);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          progression,
          "Academic progression fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
