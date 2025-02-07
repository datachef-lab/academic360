import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";

import { degreeModel } from "../models/degree.model.js";
import { findAll } from "@/utils/helper.js";


export const createDegree = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.insert(degreeModel).values(req.body).returning();
        res.status(201).json(new ApiResponse(201, "SUCCESS", records, "New Degree created successfully "))

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllDegree = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await findAll(degreeModel);
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "All Degree fetched successfully!"));
    } catch (e) {
        handleError(e, res, next);
    }
};


export const updateDegree = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;
        console.log("*body*", req.query);
        console.log("id**", id);
        const updatedData = req.body;
        const record = await db.update(degreeModel).set(updatedData).where(eq(degreeModel.id, Number(id))).returning();
        if (!record) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Degree not found"));
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", record, "Degree updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteDegree = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;
        console.log("id**", id);
        const deletedRecord = await db.delete(degreeModel).where(eq(degreeModel.id, Number(id))).returning();
        if (deletedRecord) {
            res.status(200).json(new ApiResponse(200, "Deleted", deletedRecord, "Deleted record successfully"));
        }

    } catch (error) {
        handleError(error, res, next);

    }
};