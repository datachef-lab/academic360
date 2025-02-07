import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { admissionModel, createAdmissionSchema } from "../models/admission.model.js";




export const createAdmission = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const validateData=createAdmissionSchema.parse(req.body);
        const records=await db.insert(admissionModel).values(validateData).returning();
        res.status(201).json(new ApiResponse(201,"SUCCESS",records,"New Admission is added to db!" ) );
        
    } catch (error) {
        handleError(error, res, next);
    }
};



export const getAdmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const records = await db.select().from(admissionModel).where(eq(admissionModel.id,Number(id)));
        if(!records){
              res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Admission of ID${id}  not found`));
        }
              res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched Admission successfully!"));
        
        
    } catch (error) {
       handleError(error, res, next);
    }
};

export const  getAllAdmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(admissionModel);
        if(!records){
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No Admission found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all Admission!"));
    } catch (error) {
       handleError(error, res, next);
    }
};

export const updateAdmission = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const {id}=req.query;
        const validateData=createAdmissionSchema.parse(req.body);
        const record=await db.update(admissionModel).set(validateData).where(eq(admissionModel.id,Number(id))).returning();
        if(!record){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"Admission not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",record,"Admission updated successfully"));

    } catch (error) {
        handleError(error,res,next);
    }
};

export const deleteAdmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const deletedRecord=await db.delete(admissionModel).where(eq(admissionModel.id,Number(id))).returning();
        if(!deletedRecord){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,`Admission record for ID${id} not found`));
        }
        res.status(200).json(new ApiResponse(200,"DELETED",deletedRecord,`Admission record for ID${id} deleted successfully`));
        
    } catch (error) {
        handleError(error,res,next);
        
    }
};