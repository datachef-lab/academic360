import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { db } from "@/db/index.ts";
import { eq } from "drizzle-orm";
import { createParentSchema, parentModel } from "../models/parent.model.ts";



export const createParent = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const validateData=createParentSchema.parse(req.body);
        const records=await db.insert(parentModel).values(validateData).returning();
        res.status(201).json(new ApiResponse(201,"SUCCESS",records,"New Parent is added to db!" ) );
        
    } catch (error) {
        handleError(error, res, next);
    }
};



export const getParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const records = await db.select().from(parentModel).where(eq(parentModel.id,Number(id)));
        if(!records){
              res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Parent of ID${id}  not found`));
        }
              res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched Parent successfully!"));
        
        
    } catch (error) {
       handleError(error, res, next);
    }
};

export const  getAllParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(parentModel);
        if(!records){
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No Parent found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all Parent!"));
    } catch (error) {
       handleError(error, res, next);
    }
};

export const updateParent = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const {id}=req.query;
        const validateData=createParentSchema.parse(req.body);
        const record=await db.update(parentModel).set(validateData).where(eq(parentModel.id,Number(id))).returning();
        if(!record){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"Parent not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",record,"Parent updated successfully"));

    } catch (error) {
        handleError(error,res,next);
    }
};

export const deleteParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const deletedRecord=await db.delete(parentModel).where(eq(parentModel.id,Number(id))).returning();
        if(!deletedRecord){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,`Parent record for ID${id} not found`));
        }
        res.status(200).json(new ApiResponse(200,"DELETED",deletedRecord,`Parent record for ID${id} deleted successfully`));
        
    } catch (error) {
        handleError(error,res,next);
        
    }
};