import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { db } from "@/db/index.ts";
import { eq } from "drizzle-orm";
import { createEmergencyContactSchema, emergencyContactModel } from "../models/emergencyContact.model.ts";


export const createEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const validateData=createEmergencyContactSchema.parse(req.body);
        const records=await db.insert(emergencyContactModel).values(validateData).returning();
        res.status(201).json(new ApiResponse(201,"SUCCESS",records,"New Emergency Contact is added to db!" ) );
        
    } catch (error) {
        handleError(error, res, next);
    }
};



export const getEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const records = await db.select().from(emergencyContactModel).where(eq(emergencyContactModel.id,Number(id)));
        if(!records){
              res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Emergency Contact of ID${id}  not found`));
        }
              res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched Emergency Contact successfully!"));
        
        
    } catch (error) {
       handleError(error, res, next);
    }
};

export const  getAllEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(emergencyContactModel);
        if(!records){
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No Emergency Contact found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all Emergency Contact!"));
    } catch (error) {
       handleError(error, res, next);
    }
};

export const updateEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const {id}=req.query;
        const validateData=createEmergencyContactSchema.parse(req.body);
        const record=await db.update(emergencyContactModel).set(validateData).where(eq(emergencyContactModel.id,Number(id))).returning();
        if(!record){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"Emergency Contact not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",record,"Emergency Contact updated successfully"));

    } catch (error) {
        handleError(error,res,next);
    }
};

export const deleteEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const deletedRecord=await db.delete(emergencyContactModel).where(eq(emergencyContactModel.id,Number(id))).returning();
        if(!deletedRecord){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,`Emergency Contact record for ID${id} not found`));
        }
        res.status(200).json(new ApiResponse(200,"DELETED",deletedRecord,`Emergency Contact record for ID${id} deleted successfully`));
        
    } catch (error) {
        handleError(error,res,next);
        
    }
};