import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { createPersonSchema, personModel } from "../models/person.model.js";


export const createPerson = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const validateData=createPersonSchema.parse(req.body);
        const records=await db.insert(personModel).values(validateData).returning();
        res.status(201).json(new ApiResponse(201,"SUCCESS",records,"New Person is added to db!" ) );
        
    } catch (error) {
        handleError(error, res, next);
    }
};



export const getPerson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const records = await db.select().from(personModel).where(eq(personModel.id,Number(id)));
        if(!records){
              res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Person of ID${id}  not found`));
        }
              res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched Person successfully!"));
        
        
    } catch (error) {
       handleError(error, res, next);
    }
};

export const  getAllPerson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(personModel);
        if(!records){
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No Person found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all Person!"));
    } catch (error) {
       handleError(error, res, next);
    }
};

export const updatePerson = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const {id}=req.query;
        const validateData=createPersonSchema.parse(req.body);
        const record=await db.update(personModel).set(validateData).where(eq(personModel.id,Number(id))).returning();
        if(!record){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"Person not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",record,"Person updated successfully"));

    } catch (error) {
        handleError(error,res,next);
    }
};

export const deletePerson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const deletedRecord=await db.delete(personModel).where(eq(personModel.id,Number(id))).returning();
        if(!deletedRecord){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,`Person record for ID${id} not found`));
        }
        res.status(200).json(new ApiResponse(200,"DELETED",deletedRecord,`Person record for ID${id} deleted successfully`));
        
    } catch (error) {
        handleError(error,res,next);
        
    }
};