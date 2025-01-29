import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { db } from "@/db/index.ts";
import { eq } from "drizzle-orm";

import { createGuardianSchema, gaurdianModel } from "../models/guardian.model.ts";



export const createGuardian = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const validateData=createGuardianSchema.parse(req.body);
        const records=await db.insert(gaurdianModel).values(validateData).returning();
        res.status(201).json(new ApiResponse(201,"SUCCESS",records,"New Guardian is added to db!" ) );
        
    } catch (error) {
        handleError(error, res, next);
    }
};



export const getGuardian = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const records = await db.select().from(gaurdianModel).where(eq(gaurdianModel.id,Number(id)));
        if(!records){
              res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Guardian of ID${id}  not found`));
        }
              res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched Guardian successfully!"));
        
        
    } catch (error) {
       handleError(error, res, next);
    }
};

export const  getAllGuardian = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(gaurdianModel);
        if(!records){
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No Guardian found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all Guardian!"));
    } catch (error) {
       handleError(error, res, next);
    }
};

export const updateGuardian = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const {id}=req.query;
        const validateData=createGuardianSchema.parse(req.body);
        const record=await db.update(gaurdianModel).set(validateData).where(eq(gaurdianModel.id,Number(id))).returning();
        if(!record){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"Guardian not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",record,"Guardian updated successfully"));

    } catch (error) {
        handleError(error,res,next);
    }
};

export const deleteGuardian = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const deletedRecord=await db.delete(gaurdianModel).where(eq(gaurdianModel.id,Number(id))).returning();
        if(!deletedRecord){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,`Guardian record for ID${id} not found`));
        }
        res.status(200).json(new ApiResponse(200,"DELETED",deletedRecord,`Guardian record for ID${id} deleted successfully`));
        
    } catch (error) {
        handleError(error,res,next);
        
    }
};