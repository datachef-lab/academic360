import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { nationalityModel } from "../models/nationality.model.ts";

export const createNationality = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const nationality = await db.insert(nationalityModel).values(req.body).returning();
        console.log(nationality);
        res.status(201).json(new ApiResponse(201, "CREATED", nationality, "New nationality created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllNationality= async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(nationalityModel);
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "All nationality fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateNationality=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {id}=req.query;
        console.log("*body*",req.query);
        console.log("id**",id);
        const updatedData = req.body;
       const record=await db.update(nationalityModel).set(updatedData).where(eq(nationalityModel.id,Number(id))).returning();
        if(!record){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"nationality not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",record,"Nationality updated successfully"));

    }catch(error){
        handleError(error,res,next);

    }
};

export const deleteNationality=async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {id}=req.query;
        console.log("id**",id);
        const deletedRecord=await db.delete(nationalityModel).where(eq(nationalityModel.id,Number(id))).returning();
        if(deletedRecord){
            res.status(200).json(new ApiResponse(200,"Deleted",deletedRecord,"Deleted record successfully"));
        }
        
    } catch (error) {
        handleError(error,res,next);
        
    }
};