import { db } from "@/db/index.js";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { BoardUniversity, boardUniversityModel } from "@/features/resources/models/boardUniversity.model.js";
import { findAll } from "@/utils/helper.js";

// Create a new Board University
export const createBoardUniversity = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        console.log(req.body);
        const BoardUniversity = await db
            .insert(boardUniversityModel)
            .values(req.body);
        console.log("New board university added", BoardUniversity);
        res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    "SUCCESS",
                    null,
                    "New board university is added to db!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all Board University
export const getAllBoardUniversity = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const boardUniversity = await findAll(boardUniversityModel);
        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    boardUniversity,
                    "Fetched all Board University!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get by Board University by ID
export const getBoardUniversityById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        const BoardUniversity = await db
            .select()
            .from(boardUniversityModel)
            .where(eq(boardUniversityModel.id, Number(id)))
            .limit(1);

        if (!BoardUniversity[0]) {
            res
                .status(404)
                .json(
                    new ApiResponse(404, "NOT_FOUND", null, "Board University not found"),
                );
            return;
        }

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    BoardUniversity[0],
                    "Fetched Board University!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update the Board University
export const updateBoardUniversity = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
         const {createdAt,updatedAt,...props}=req.body as BoardUniversity

        const existingBoardUniversity = await db
            .select()
            .from(boardUniversityModel)
            .where(eq(boardUniversityModel.id, +id))
            .then((BoardUniversity) => BoardUniversity[0]);

        if (!existingBoardUniversity) {
            res.status(404).json(new ApiError(404, "Board University not found"));
            return;
        }

        const updatedBoards = await db
            .update(boardUniversityModel)
            .set(props)
            .where(eq(boardUniversityModel.id, +id))
            .returning();

        if (updatedBoards.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        updatedBoards[0],
                        "Board University updated successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Language Medium not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete the Board University
export const deleteBoardUniversity = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const deletedBoardUniversity = await db
            .delete(boardUniversityModel)
            .where(eq(boardUniversityModel.id, +id))
            .returning();

        if (deletedBoardUniversity.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        deletedBoardUniversity[0],
                        "Board University deleted successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Board University not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};