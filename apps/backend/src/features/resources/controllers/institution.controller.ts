import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.ts";
import { institutionModel } from "../models/institution.model.ts";
import { findAll } from "@/utils/helper.ts";

// Create a new Institution
export const createNewInstitution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log(req.body);
        const newInstitution = await db
            .insert(institutionModel)
            .values(req.body);
        console.log("New institution added", newInstitution);
        res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    "SUCCESS",
                    null,
                    "New institution is added to db!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all Institution
export const getAllInstitution = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const institution = await findAll(institutionModel);
        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    institution,
                    "Fetched all Institution!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get Institution By ID
export const getInstitutionById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        const institution = await db
            .select()
            .from(institutionModel)
            .where(eq(institutionModel.id, Number(id)))
            .limit(1);

        if (!institution[0]) {
            res
                .status(404)
                .json(
                    new ApiResponse(404, "NOT_FOUND", null, "Institution not found"),
                );
            return;
        }

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    institution[0],
                    "Fetched Institution!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update the Institution
export const updateInstitution = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const updatedInstitution = req.body;

        const existingInstitution = await db
            .select()
            .from(institutionModel)
            .where(eq(institutionModel.id, +id))
            .then((Institution) => Institution[0]);

        if (!existingInstitution) {
            res.status(404).json(new ApiError(404, "Institution not found"));
            return;
        }

        const updatedInstitutions = await db
            .update(institutionModel)
            .set(updatedInstitution)
            .where(eq(institutionModel.id, +id))
            .returning();

        if (updatedInstitutions.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        updatedInstitutions[0],
                        "Institutions updated successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Institutions not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete the Institution
export const deleteInstitutions = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const deletedInstitutions = await db
            .delete(institutionModel)
            .where(eq(institutionModel.id, +id))
            .returning();

        if (deletedInstitutions.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        deletedInstitutions[0],
                        "Institutions deleted successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Institutions not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};
