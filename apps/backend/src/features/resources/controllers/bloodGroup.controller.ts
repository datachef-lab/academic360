import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { BloodGroup, bloodGroupModel } from "../models/bloodGroup.model.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.ts";
import { findAll } from "@/utils/helper.ts";
import {
  addBloodGroup,
  findBloodGroupById,
  removeBloodGroup,
  saveBloodGroup,
} from "../services/bloodGroup.service.ts";

// Create a new blood group
export const createBloodGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const newBloodGroupModel = await addBloodGroup(req.body);
    console.log(newBloodGroupModel);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          null,
          "New Blood Group is added to db!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all blood groups
export const getAllBloodGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const bloodGroups = await findAll(bloodGroupModel);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          bloodGroups,
          "All Blood Groups fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get a specific blood group
export const getBloodGroupById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const foundBloodGroup = await findBloodGroupById(+id);

    if (!foundBloodGroup) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Blood group not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          foundBloodGroup,
          "Fetched blood group!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update a blood group
export const updateBloodGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const { type } = req.body;

    const updatedBloodGroup = await saveBloodGroup(+id, type);

    if (!updatedBloodGroup) {
      res.status(404).json(new ApiError(404, "Blood Group not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedBloodGroup,
          " updated Blood Group successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete a blood group
export const deleteBloodGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);

    const isDeleted = await removeBloodGroup(+id);

    if (isDeleted) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            true,
            "Blood Group deleted successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Blood Group not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};