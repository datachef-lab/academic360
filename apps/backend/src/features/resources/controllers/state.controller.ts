import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { stateModel } from "../models/state.model.ts";


export const createState = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const records = await db.insert(stateModel).values(req.body).returning();
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "CREATED",
          records,
          "New State record created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllState = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const records = await db.select().from(stateModel);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          records,
          "All State records fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateStateRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.query;
    const updatedData = req.body;
    const records = await db
      .update(stateModel)
      .set(updatedData)
      .where(eq(stateModel.id, Number(id)))
      .returning();
    if (records) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "UPDATED",
            "State records updated successfully",
          ),
        );
    }
    res
      .status(404)
      .json(
        new ApiResponse(404, "NOT_FOUND", null, "State record not found"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteStateRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.query;
    console.log("id**", id);
    const deletedRecord = await db
      .delete(stateModel)
      .where(eq(stateModel.id, Number(id)))
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
