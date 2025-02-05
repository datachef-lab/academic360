import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { BloodGroup, bloodGroupModel } from "../models/bloodGroup.model.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.ts";
import { findAll } from "@/utils/helper.ts";

// Create a new blood group
export const createBloodGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log(req.body);
        const newBloodGroupModel = await db
            .insert(bloodGroupModel)
            .values(req.body);
        console.log("New Document added", newBloodGroupModel);
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
                    "All Blood Groups fetched successfully.",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get a specific blood group
export const getBloodGroup = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        const bloodGroup = await db
            .select()
            .from(bloodGroupModel)
            .where(eq(bloodGroupModel.id, Number(id)))
            .limit(1);

        if (!bloodGroup[0]) {
            res
                .status(404)
                .json(new ApiResponse(404, "NOT_FOUND", null, "Blood group not found"));
            return;
        }

        res
            .status(200)
            .json(
                new ApiResponse(200, "SUCCESS", bloodGroup[0], "Fetched blood group!"),
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
        const updatedBloodGroup = req.body;

        const existingBloodGroup = await db
            .select()
            .from(bloodGroupModel)
            .where(eq(bloodGroupModel.id, +id))
            .then((bloodGroup) => bloodGroup[0]);

        if (!existingBloodGroup) {
            res.status(404).json(new ApiError(404, "Blood Group not found"));
            return;
        }

        const updateBloodGroup = await db
            .update(bloodGroupModel)
            .set(updatedBloodGroup)
            .where(eq(bloodGroupModel.id, +id))
            .returning();

        if (updateBloodGroup.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        updateBloodGroup[0],
                        " updated Blood Group successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Blood Group not found"));
        }
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
        const deletedBloodGroup = await db
            .delete(bloodGroupModel)
            .where(eq(bloodGroupModel.id, +id))
            .returning();

        if (deletedBloodGroup.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        deletedBloodGroup[0],
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