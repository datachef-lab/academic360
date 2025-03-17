import { db } from "@/db/index";
import { NextFunction, Request, Response } from "express";
import { personalDetailsModel } from "../models/personalDetails.model";
import { ApiError, ApiResponse, handleError } from "@/utils";
import { eq } from "drizzle-orm";

// createPersonalDetails
export const createPersonalDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const newpersonalDetailsModels = await db
      .insert(personalDetailsModel)
      .values(req.body);
    console.log("New Personal details added", newpersonalDetailsModels);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          null,
          "New Personal Details is added to db!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//getAllPersonalDetails
export const getAllPersonalDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const getAllPersonalDetails = await db.select().from(personalDetailsModel);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          getAllPersonalDetails,
          "All personal details fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//getPersonalDetailsById
export const getPersonalDetailsById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.query;
    console.log(id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Id is required"));
      return;
    }

    const personalDetails = await db
      .select()
      .from(personalDetailsModel)
      .where(eq(personalDetailsModel.id, +id))
      .then((personalDetails) => personalDetails[0]);

    if (!personalDetails) {
      res.status(404).json(new ApiError(404, "peronal details not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          personalDetails,
          "personal details fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getPersonalDetailsByStudentId = async (
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

    const personalDetails = await db
      .select()
      .from(personalDetailsModel)
      .where(eq(personalDetailsModel.studentId, +studentId))
      .then((personalDetails) => personalDetails[0]);

    if (!personalDetails) {
      res.status(404).json(new ApiError(404, "peronal details not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          personalDetails,
          "personal details fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//updatePersonalDetails
export const updatePersonalDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const updatedPersonalDetails = req.body;

    const existingPersonalDetails = await db
      .select()
      .from(personalDetailsModel)
      .where(eq(personalDetailsModel.id, +id))
      .then((personalDetails) => personalDetails[0]);

    if (!existingPersonalDetails) {
      res.status(404).json(new ApiError(404, "Personal Details not found"));
      return;
    }

    const updatedpersonaldetail = await db
      .update(personalDetailsModel)
      .set(updatedPersonalDetails)
      .where(eq(personalDetailsModel.id, +id))
      .returning();

    if (updatedpersonaldetail.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            updatedpersonaldetail[0],
            "personal details updated successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "personal details not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

//deletePersonalDetails
export const deletePersonalDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const deletedPersonalDetails = await db
      .delete(personalDetailsModel)
      .where(eq(personalDetailsModel.id, +id))
      .returning();

    if (deletedPersonalDetails.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            deletedPersonalDetails[0],
            "personal details deleted successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "personal details not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};
