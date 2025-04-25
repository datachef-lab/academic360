import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import { occupationModel } from "@/features/resources/models/occupation.model.js";
import { findAll } from "@/utils/helper.js";
import { ApiError } from "@/utils/index.js";

export const createOccupation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const records = await db
      .insert(occupationModel)
      .values(req.body)
      .returning();
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          records,
          "New occupation created successfully ",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllOccupation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const records = await findAll(occupationModel);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          records,
          "All occupation fetched successfully!",
        ),
      );
  } catch (e) {
    handleError(e, res, next);
  }
};

export const updateOccupation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const updatedOccupation = req.body;

    const existingOccupation = await db
      .select()
      .from(occupationModel)
      .where(eq(occupationModel.id, +id))
      .then((occupation) => occupation[0]);

    if (!existingOccupation) {
      res.status(404).json(new ApiError(404, "Occupation not found"));
      return;
    }

    const updateOccupation = await db
      .update(occupationModel)
      .set(updatedOccupation)
      .where(eq(occupationModel.id, +id))
      .returning();

    if (updateOccupation.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            updateOccupation[0],
            "Occupation updated successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Occupation not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteOccupation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.query;
    console.log("id**", id);
    const deletedRecord = await db
      .delete(occupationModel)
      .where(eq(occupationModel.id, Number(id)))
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
