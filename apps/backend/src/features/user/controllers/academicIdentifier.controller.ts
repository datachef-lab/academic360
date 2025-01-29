import { ApiResponse } from "@/utils/ApiResonse.ts";
import { NextFunction, Response, Request } from "express";
import { academicIdentifierModel, createAcademicIdentifierSchema } from "../models/academicIdentifier.model.ts";
import { db } from "@/db/index.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";

export const createAcademicIdentifier = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const validateData=createAcademicIdentifierSchema.parse(req.body);
        const records=await db.insert(academicIdentifierModel).values(validateData).returning();  
        res.status(201).json(new ApiResponse(201,"SUCCESS",records,"New academicIdentifier is added to db!" ) );
    } catch (error) {
        handleError(error, res, next);
    }
};


export const getAcademicIdentifier = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const {id}=req.query;
        const records = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.id,Number(id)));
        if(!records){
              res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicIdentifier of ID${id}  not found`));
        }
               res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched academicIdentifier successfully!"));
        
        
    } catch (error) {
       handleError(error, res, next);
    }
};


export const  getAllAcademicIdentifier = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(academicIdentifierModel);
        if(!records){
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No academicIdentifier found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all academicIdentifier!"));
    } catch (error) {
       handleError(error, res, next);
    }
};

export const updateAcademicIdentifier = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const {id}=req.params;
        const validateData=createAcademicIdentifierSchema.parse(req.body);
        const record=await db.update(academicIdentifierModel).set(validateData).where(eq(academicIdentifierModel.id,Number(id))).returning();
        if(!record){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"academicIdentifier not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",record,"AcademicIdentifier updated successfully"));

    } catch (error) {
        handleError(error,res,next);

    }
};

export const deleteAcademicIdentifier = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.params;
        const deletedRecord=await db.delete(academicIdentifierModel).where(eq(academicIdentifierModel.id,Number(id))).returning();
        if(deletedRecord){
            res.status(200).json(new ApiResponse(200,"Deleted",deletedRecord,"Deleted record successfully"));
        }
        
    } catch (error) {
        handleError(error,res,next);
        
    }
};