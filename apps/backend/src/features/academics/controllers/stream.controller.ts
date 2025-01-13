import { NextFunction, Request, Response } from "express";
import { streamModel } from "../models/stream.model.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";

// Update a stream
export const updateStream = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const exisitingStream = await db
      .select()
      .from(streamModel)
      .where(eq(streamModel.id, +id))
      .then((streams) => streams[0]);

    if (!exisitingStream) {
      res.status(404).json(new ApiError(404, "Stream not found"));
      return;
    }

    const updatedStream = await db
      .update(streamModel)
      .set(updatedData)
      .where(eq(streamModel.id, +id))
      .returning();

    if (updatedStream.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            updatedStream[0],
            "User updated successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "User not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete a stream
export const deleteStream = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    const deletedStream = await db
      .delete(streamModel)
      .where(eq(streamModel.id, +id))
      .returning();

    if (deletedStream.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            deletedStream[0],
            "Stream deleted successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Stream not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};
