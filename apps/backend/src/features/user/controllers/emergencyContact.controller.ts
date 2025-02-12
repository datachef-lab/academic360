import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { createEmergencyContactSchema, EmergencyContact, emergencyContactModel } from "../models/emergencyContact.model.js";
import { addEmergencyContact, findEmergencyContactById } from "../services/emergencyContact.service.js";

export const createEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newEmergencyContact = await addEmergencyContact(req.body as EmergencyContact);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newEmergencyContact, "New Emergency Contact is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getEmergencyContactById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const foundEmergencyContact = await findEmergencyContactById(Number(id));

        if (!foundEmergencyContact) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Emergency Contact of ID${id}  not found`));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", foundEmergencyContact, "Fetched Emergency Contact successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const updatedEmergencyContact = await db.update(emergencyContactModel).set(req.body).where(eq(emergencyContactModel.id, Number(id))).returning();

        if (!updatedEmergencyContact) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Emergency Contact not found"));
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updatedEmergencyContact, "Emergency Contact updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};