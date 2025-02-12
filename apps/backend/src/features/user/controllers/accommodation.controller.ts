import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { Accommodation, accommodationModel, createAccommodationSchema } from "@/features/user/models/accommodation.model.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";

import { AccommodationType } from "@/types/user/accommodation.js";
import { addAccommodation, findAccommotionById, findAccommotionByStudentId } from "../services/accommodation.service.js";

export const createAccommodation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newAccommodation = await addAccommodation(req.body as AccommodationType);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newAccommodation, "New accommodation is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAccommodationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const foundAccommodation = await findAccommotionById(Number(id));

        if (!foundAccommodation) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `accommodation of ID${id}  not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundAccommodation, "Fetched accommodation successfully!"));


    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAccommodationByStudentId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { studentId } = req.query;

        const foundAccommodation = await findAccommotionByStudentId(Number(studentId));

        if (!foundAccommodation) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `accommodation of studentId: ${studentId}  not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundAccommodation, "Fetched accommodation successfully!"));


    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateAccommodation = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
        res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Fields content can not be empty"));
    }
    try {
        const { id } = req.query;
        const validateData = createAccommodationSchema.parse(req.body);
        const record = await db.update(accommodationModel).set(validateData).where(eq(accommodationModel.id, Number(id))).returning();
        if (!record) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "accommodation not found"));
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", record, "Accommodation updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};