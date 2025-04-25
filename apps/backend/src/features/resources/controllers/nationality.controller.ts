import { db } from "@/db/index.js";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { eq } from "drizzle-orm";
import { nationalityModel } from "@/features/resources/models/nationality.model.js";
import { findAll } from "@/utils/helper.js";
import { ApiError } from "@/utils/index.js";

export const createNationality = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const nationality = await db
      .insert(nationalityModel)
      .values(req.body)
      .returning();
    console.log(nationality);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "CREATED",
          nationality,
          "New nationality created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllNationality = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const records = await findAll(nationalityModel);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          records,
          "All nationality fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateNationality = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const updatedNationality = req.body;

    const existingNationality= await db
      .select()
      .from(nationalityModel)
      .where(eq(nationalityModel.id, +id))
      .then((nationality) => nationality[0]);

    if (!existingNationality) {
      res.status(404).json(new ApiError(404, "Nationality not found"));
      return;
    }

    const updateNationality = await db
      .update(nationalityModel)
      .set(updatedNationality)
      .where(eq(nationalityModel.id, +id))
      .returning();

    if (updateNationality.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            updateNationality[0],
            "Nationality updated successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Nationality not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteNationality = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.query;
    console.log("id**", id);
    const deletedRecord = await db
      .delete(nationalityModel)
      .where(eq(nationalityModel.id, Number(id)))
      .returning();
    if (deletedRecord) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "Deleted",
            deletedRecord,
            "Deleted record successfully",
          ),
        );
    }
  } catch (error) {
    handleError(error, res, next);
  }
};
