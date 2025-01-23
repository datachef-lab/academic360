import { NextFunction,Response,Request } from "express";
import { countryModel } from "../models/country.model.ts";
import { db } from "@/db/index.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";

export const createCountry =async(req: Request, res: Response, next: NextFunction,) => {
    try {
        const records=await db.insert(countryModel).values(req.body).returning();
        res.status(201).json(new ApiResponse(201, "CREATED", records, "New country created successfully!"));
        
    } catch (error) {
        handleError(error,res,next);
        
    }
};



export const getAllCountry = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(countryModel);
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "All country fetched successfully!"));
    } catch (error) {
        handleError(error,res,next);
       
    }
};



export const updateCountryRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const updatedData= req.body;
        const records = await db.update(countryModel).set(updatedData).where(eq(countryModel.id,Number(id))).returning();
        if(!records){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"country not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",records,"country updated successfully"));

    } catch (error) {
        handleError(error,res,next);
    }
};

export const deleteCountryRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
           const {id}=req.query;
           console.log("id**",id);
           const deletedRecord=await db.delete(countryModel).where(eq(countryModel.id,Number(id))).returning();
           if(deletedRecord){
               res.status(200).json(new ApiResponse(200,"Deleted",deletedRecord,"Deleted record successfully"));
           }
           
       } catch (error) {
           handleError(error,res,next);
           
       }
};