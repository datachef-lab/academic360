import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.ts";
import { qualificationModel } from "../models/qualification.model.ts";


// Create a new Qualification
export const createNewQualification = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        console.log(req.body);
        const newQualification = await db
            .insert(qualificationModel)
            .values(req.body);
        console.log("New Qualification added", newQualification);
        res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    "SUCCESS",
                    null,
                    "New Qualification is added to db!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all Qualification
export const getAllQualification = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const qualification = await db.select().from(qualificationModel);
        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    qualification,
                    "Fetched all qualification!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get last Qualification By ID
export const getQualificationById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        const qualification = await db
            .select()
            .from(qualificationModel)
            .where(eq(qualificationModel.id, Number(id)))
            .limit(1);

        if (!qualification[0]) {
            res
                .status(404)
                .json(
                    new ApiResponse(404, "NOT_FOUND", null, "Qualification not found"),
                );
            return;
        }

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    qualification[0],
                    "Fetched Qualifications!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update the Qualification
export const updateQualification = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const updatedQualification = req.body;

        const existingQualification = await db
            .select()
            .from(qualificationModel)
            .where(eq(qualificationModel.id, +id))
            .then((qualification) => qualification[0]);

        if (!existingQualification) {
            res.status(404).json(new ApiError(404, "Qualifications not found"));
            return;
        }

        const updatedQualifications = await db
            .update(qualificationModel)
            .set(updatedQualification)
            .where(eq(qualificationModel.id, +id))
            .returning();

        if (updatedQualifications.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        updatedQualifications[0],
                        "Qualifications updated successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Qualification not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete the Qualification
export const deleteQualifications = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const deletedQualifications = await db
            .delete(qualificationModel)
            .where(eq(qualificationModel.id, +id))
            .returning();

        if (deletedQualifications.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        deletedQualifications[0],
                        "Qualifications deleted successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Qualifications not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};
