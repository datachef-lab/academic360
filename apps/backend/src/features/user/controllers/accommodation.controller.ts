import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.ts";
import { accommodationModel, createAccommodationSchema } from "../models/accommodation.model.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { db } from "@/db/index.ts";
import { eq } from "drizzle-orm";



export const createAccommodation = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const validateData=createAccommodationSchema.parse(req.body);
        const records=await db.insert(accommodationModel).values(validateData).returning();
        res.status(201).json(new ApiResponse(201,"SUCCESS",records,"New accommodation is added to db!" ) );
        
    } catch (error) {
        handleError(error, res, next);
    }
};



export const getAccommodation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const records = await db.select().from(accommodationModel).where(eq(accommodationModel.id,Number(id)));
        if(!records){
              res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `accommodation of ID${id}  not found`));
        }
              res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched accommodation successfully!"));
        
        
    } catch (error) {
       handleError(error, res, next);
    }
};

export const  getAllAccommodation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(accommodationModel);
        if(!records){
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No accommodation found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all accommodation!"));
    } catch (error) {
       handleError(error, res, next);
    }
};

export const updateAccommodation = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const {id}=req.query;
        const validateData=createAccommodationSchema.parse(req.body);
        const record=await db.update(accommodationModel).set(validateData).where(eq(accommodationModel.id,Number(id))).returning();
        if(!record){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"accommodation not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",record,"Accommodation updated successfully"));

    } catch (error) {
        handleError(error,res,next);
    }
};

export const deleteAccommodation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const deletedRecord=await db.delete(accommodationModel).where(eq(accommodationModel.id,Number(id))).returning();
        if(!deletedRecord){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,`accommodation record for ID${id} not found`));
        }
        res.status(200).json(new ApiResponse(200,"DELETED",deletedRecord,`accommodation record for ID${id} deleted successfully`));
        
    } catch (error) {
        handleError(error,res,next);
        
    }
};