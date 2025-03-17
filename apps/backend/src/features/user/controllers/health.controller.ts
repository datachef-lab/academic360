import { db } from "@/db/index";
import { NextFunction, Request, Response } from "express";
import { healthModel } from "../models/health.model";
import { ApiError, ApiResponse, handleError } from "@/utils";
import { eq } from "drizzle-orm";

// createHealthDetails
export const createHealthDetails= async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const newHealthDetails = await db
      .insert(healthModel)
      .values(req.body);
    console.log("New health details added", newHealthDetails);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          null,
          "New Health Details is added to db!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//getAllHealthDetails
export const getAllHealthDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const getAllHealthDetails = await db.select().from(healthModel);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          getAllHealthDetails,
          "All Health details fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//getHealthDetailsById
export const getHealthDetailsById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Id is required"));
      return;
    }

    const healthDetails = await db
      .select()
      .from(healthModel)
      .where(eq(healthModel.id, +id))
      .then((healthDetails) => healthDetails[0]);

    if (!healthDetails) {
      res.status(404).json(new ApiError(404, "Health details not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          healthDetails,
          "Health details fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// getHealthDetailsByStudentId
export const getHealthDetailsByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentId } = req.params;
    console.log(studentId);
    if (!studentId) {
      res.status(400).json(new ApiError(400, "Id is required"));
      return;
    }

    const healthDetails = await db
      .select()
      .from(healthModel)
      .where(eq(healthModel.studentId, +studentId))
      .then((healthDetails) => healthDetails[0]);

    if (!healthDetails) {
      res.status(404).json(new ApiError(404, "Health details not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          healthDetails,
          "Health details fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//updateHealthDetails
export const updateHealthDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const updatedPersonalDetails = req.body;

    const existingHealthDetails = await db
      .select()
      .from(healthModel)
      .where(eq(healthModel.id, +id))
      .then((healthDetails) => healthDetails[0]);

    if (!existingHealthDetails) {
      res.status(404).json(new ApiError(404, "Health Details not found"));
      return;
    }

    const updatedHealthDetail = await db
      .update(healthModel)
      .set(updatedPersonalDetails)
      .where(eq(healthModel.id, +id))
      .returning();

    if (updatedHealthDetail.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            updatedHealthDetail[0],
            "Health details updated successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Health details not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

//deleteHealthDetails
export const deleteHealthDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const deletedHealthDetails = await db
      .delete(healthModel)
      .where(eq(healthModel.id, +id))
      .returning();

    if (deletedHealthDetails.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            deletedHealthDetails[0],
            "Health details deleted successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Health details not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};