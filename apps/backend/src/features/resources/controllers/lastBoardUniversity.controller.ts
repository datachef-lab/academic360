import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.ts";
import { lastBoardUniversityModel } from "../models/lastBoardUniversity.model.ts";

// Create a new last Board University
export const createNewLastBoardUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const newLastBoardUniversity = await db
      .insert(lastBoardUniversityModel)
      .values(req.body);
    console.log("New last board university added", newLastBoardUniversity);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          null,
          "New last board university is added to db!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all last Board University
export const getAllLastBoardUniversity= async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const lastBoardUniversity = await db.select().from(lastBoardUniversityModel);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          lastBoardUniversity,
          "Fetched all Last Board University!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get by last Board University by ID
export const getLastBoardUniversityById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const lastBoardUniversity = await db
      .select()
      .from(lastBoardUniversityModel)
      .where(eq(lastBoardUniversityModel.id, Number(id)))
      .limit(1);

    if (!lastBoardUniversity[0]) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Last Board University not found"),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          lastBoardUniversity[0],
          "Fetched Last Board University!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update the last Board University
export const updateLastBoardUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const updatedLastBoardUniversity = req.body;

    const existingLastBoardUniversity = await db
      .select()
      .from(lastBoardUniversityModel)
      .where(eq(lastBoardUniversityModel.id, +id))
      .then((lastBoardUniversity) => lastBoardUniversity[0]);

    if (!existingLastBoardUniversity) {
      res.status(404).json(new ApiError(404, "Last Board University not found"));
      return;
    }

    const updatedLastBoards = await db
      .update(lastBoardUniversityModel)
      .set(updatedLastBoardUniversity)
      .where(eq(lastBoardUniversityModel.id, +id))
      .returning();

    if (updatedLastBoards.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            updatedLastBoards[0],
            "Last Board University updated successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Language Medium not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete the last Board University
export const deleteLastBoardUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const deletedLastBoardUniversity = await db
      .delete(lastBoardUniversityModel)
      .where(eq(lastBoardUniversityModel.id, +id))
      .returning();

    if (deletedLastBoardUniversity.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            deletedLastBoardUniversity[0],
            "Last Board University deleted successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Last Board University not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};