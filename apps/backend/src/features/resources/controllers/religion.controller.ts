import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { religionModel } from "../models/religion.model.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";

export const createReligion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const records = await db.insert(religionModel).values(req.body).returning();
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "CREATED",
          records,
          "New religion record created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllReligion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const records = await db.select().from(religionModel);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          records,
          "All religion records fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateReligionRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.query;
    const updatedData = req.body;
    const records = await db
      .update(religionModel)
      .set(updatedData)
      .where(eq(religionModel.id, Number(id)))
      .returning();
    if (records) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "UPDATED",
            "Religion records updated successfully",
          ),
        );
    }
    res
      .status(404)
      .json(
        new ApiResponse(404, "NOT_FOUND", null, "religion record not found"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteReligionRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.query;
    console.log("id**", id);
    const deletedRecord = await db
      .delete(religionModel)
      .where(eq(religionModel.id, Number(id)))
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
