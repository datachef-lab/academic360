
import { NextFunction, Response, Request } from "express";
import { academicHistoryModel, createAcademicHistorySchema } from "../models/academicHistory.model.ts";
import { db } from "@/db/index.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";

export const createAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json({
            status: "ERROR",
            code: 400,
            message: "Fields content can not be empty",
            details: "The request body is missing or malformed. Please check the input and try again."
        });
    }
    try {
        const validateData=createAcademicHistorySchema.parse(req.body);
        const records=await db.insert(academicHistoryModel).values(validateData).returning();
        res.status(201).json(new ApiResponse(201,"SUCCESS",records,"New academicHistory is added to db!" ) );
    } catch (error) {
        handleError(error, res, next);
    }
};


export const getAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const records = await db.select().from(academicHistoryModel).where(eq(academicHistoryModel.id,Number(id)));
        if(!records){
              res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicHistory of ID${id}  not found`));
        }else{
               res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched academicHistory successfully!"));
          }
        
    } catch (error) {
        handleError(error, res, next);
    }
};


export const getAllAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(academicHistoryModel);
        if(!records){
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No academicHistory found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all academicHistory!"));
    } catch (error) {
       handleError(error, res, next);
    }
};

export const updateAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
       const {id}=req.params;
       const validateData=createAcademicHistorySchema.parse(req.body);
       const records=await db.update(academicHistoryModel).set(validateData).where(eq(academicHistoryModel.id,Number(id))).returning();
         if(!records){
              res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"academicHistory not found"));
         }
            res.status(200).json(new ApiResponse(200,"UPDATED",records,`academicHistory of ID${id} updated successfully`));
    } catch (error) {
        handleError(error, res, next);

    }
};

export const deleteAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.params;
        const deletedRecord=await db.delete(academicHistoryModel).where(eq(academicHistoryModel.id,Number(id))).returning();
        if(!deletedRecord){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"academicHistory not found"));
        }
        res.status(200).json(new ApiResponse(200,"DELETED",deletedRecord,`academicHistory of ID${id} deleted successfully`));
        
    } catch (error) {
        handleError(error,res,next);
    }
};