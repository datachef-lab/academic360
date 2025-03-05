import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { createEmergencyContactSchema, EmergencyContact, emergencyContactModel } from "../models/emergencyContact.model.js";
import { addEmergencyContact, findEmergencyContactById, findEmergencyContactByStudentId } from "../services/emergencyContact.service.js";

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
export const getEmergencyContactByStudentId =async(req:Request,res:Response,next:NextFunction)=>{
    try {
            const { studentId } = req.query;
    
            const foundAcademicIdentifier = await findEmergencyContactByStudentId(Number(studentId));
    
            if (!foundAcademicIdentifier) {
                res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicIdentifier of ID${studentId}  not found`));
                return;
            }
            res.status(200).json(new ApiResponse(200, "SUCCESS", foundAcademicIdentifier, "Fetched academicIdentifier successfully!"));
    
    
        } catch (error) {
            handleError(error, res, next);
        }
}
//h
export const updateEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        console.log("body",req.body);
        const {createdAt,updatedAt,...props}=req.body as EmergencyContact
//sa

        const updatedEmergencyContact = await db.update(emergencyContactModel).set({...props}).where(eq(emergencyContactModel.id, Number(id))).returning();

        if (!updatedEmergencyContact) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Emergency Contact not found"));
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updatedEmergencyContact, "Emergency Contact updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};