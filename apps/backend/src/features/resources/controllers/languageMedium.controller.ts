import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.ts";
import { languageMediumModel } from "../models/languageMedium.model.ts";

// Create a new language Medium
export const createNewLanguageMedium = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const newLanguageMedium = await db
      .insert(languageMediumModel)
      .values(req.body);
    console.log("New language Medium added", newLanguageMedium);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          null,
          "New language Medium is added to db!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all language Medium
export const getAllLanguageMedium = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const languageMedium = await db.select().from(languageMediumModel);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          languageMedium,
          "Fetched all language Medium!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get by language Medium by ID
export const getLanguageMediumById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const languageMedium = await db
      .select()
      .from(languageMediumModel)
      .where(eq(languageMediumModel.id, Number(id)))
      .limit(1);

    if (!languageMedium[0]) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Language Medium not found"),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          languageMedium[0],
          "Fetched Language Medium!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update the language Medium
export const updateLanguageMedium = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const updatedLanguageMedium = req.body;

    const existingLanguageMedium = await db
      .select()
      .from(languageMediumModel)
      .where(eq(languageMediumModel.id, +id))
      .then((language) => language[0]);

    if (!existingLanguageMedium) {
      res.status(404).json(new ApiError(404, "Language Medium not found"));
      return;
    }

    const updatedLanguages = await db
      .update(languageMediumModel)
      .set(updatedLanguageMedium)
      .where(eq(languageMediumModel.id, +id))
      .returning();

    if (updatedLanguages.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            updatedLanguages[0],
            "Language Medium updated successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Language Medium not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete the Language Medium
export const deleteLanguageMedium = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const deletedLanguageMedium = await db
      .delete(languageMediumModel)
      .where(eq(languageMediumModel.id, +id))
      .returning();

    if (deletedLanguageMedium.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            deletedLanguageMedium[0],
            "Language Medium deleted successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Language Medium not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};