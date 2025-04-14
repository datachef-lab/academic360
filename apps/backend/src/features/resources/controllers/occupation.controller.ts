import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import { occupationModel } from "@/features/resources/models/occupation.model.js";
import { findAll } from "@/utils/helper.js";


export const createOccupation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.insert(occupationModel).values(req.body).returning();
        res.status(201).json(new ApiResponse(201, "SUCCESS", records, "New occupation created successfully "))

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllOccupation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await findAll(occupationModel);
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "All occupation fetched successfully!"));
    } catch (e) {
        handleError(e, res, next);
    }
};

// Get a specific occupation
export const getOccupationById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        const occupation = await db
            .select()
            .from(occupationModel)
            .where(eq(occupationModel.id, Number(id)))
            .limit(1);

        if (!occupation[0]) {
            res
                .status(404)
                .json(new ApiResponse(404, "NOT_FOUND", null, "Occupation not found"));
            return;
        }

        res
            .status(200)
            .json(
                new ApiResponse(200, "SUCCESS", occupation[0], "Fetched all Occupations!"),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};
export const updateOccupation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;
        console.log("*body*", req.query);
        console.log("id**", id);
        const updatedData = req.body;
        const record = await db.update(occupationModel).set(updatedData).where(eq(occupationModel.id, Number(id))).returning();
        if (!record) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "occupation not found"));
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", record, "occupation updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteOccupation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;
        console.log("id**", id);
        const deletedRecord = await db.delete(occupationModel).where(eq(occupationModel.id, Number(id))).returning();
        if (deletedRecord) {
            res.status(200).json(new ApiResponse(200, "Deleted", deletedRecord, "Deleted record successfully"));
        }

    } catch (error) {
        handleError(error, res, next);

    }
};