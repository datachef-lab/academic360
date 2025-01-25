import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.ts";
import { lastInstitutionModel } from "../models/lastInstitution.model.ts";

// Create a new last Institution
export const createNewLastInstitution = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const newLastInstitution = await db
      .insert(lastInstitutionModel)
      .values(req.body);
    console.log("New last institution added", newLastInstitution);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          null,
          "New last institution is added to db!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all last Institution
export const getAllLastInstitution = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const lastInstitution = await db.select().from(lastInstitutionModel);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          lastInstitution,
          "Fetched all Last Institution!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get last Institution By ID
export const getLastInstitutionById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const lastInstitution = await db
      .select()
      .from(lastInstitutionModel)
      .where(eq(lastInstitutionModel.id, Number(id)))
      .limit(1);

    if (!lastInstitution[0]) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Last Institution not found"),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          lastInstitution[0],
          "Fetched Last Institution!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update the last Institution
export const updateLastInstitution = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const updatedLastInstitution = req.body;

    const existingLastInstitution = await db
      .select()
      .from(lastInstitutionModel)
      .where(eq(lastInstitutionModel.id, +id))
      .then((lastInstitution) => lastInstitution[0]);

    if (!existingLastInstitution) {
      res.status(404).json(new ApiError(404, "Last Institution not found"));
      return;
    }

    const updatedLastInstitutions = await db
      .update(lastInstitutionModel)
      .set(updatedLastInstitution)
      .where(eq(lastInstitutionModel.id, +id))
      .returning();

    if (updatedLastInstitutions.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            updatedLastInstitutions[0],
            "Last Institutions updated successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Last Institutions not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete the last Institution
export const deleteLastInstitutions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const deletedLastInstitutions = await db
      .delete(lastInstitutionModel)
      .where(eq(lastInstitutionModel.id, +id))
      .returning();

    if (deletedLastInstitutions.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            deletedLastInstitutions[0],
            "Last Institutions deleted successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Last Institutions not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};
