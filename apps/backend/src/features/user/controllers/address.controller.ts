import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { db } from "@/db/index.ts";
import { eq } from "drizzle-orm";
import { addressModel, createAddressSchema } from "../models/address.model.ts";



export const createAddress = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const validateData=createAddressSchema.parse(req.body);
        const records=await db.insert(addressModel).values(validateData).returning();
        res.status(201).json(new ApiResponse(201,"SUCCESS",records,"New Address is added to db!" ) );
        
    } catch (error) {
        handleError(error, res, next);
    }
};



export const getAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const records = await db.select().from(addressModel).where(eq(addressModel.id,Number(id)));
        if(!records){
              res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Address of ID${id}  not found`));
        }
              res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched Address successfully!"));
        
        
    } catch (error) {
       handleError(error, res, next);
    }
};

export const  getAllAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(addressModel);
        if(!records){
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No Address found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all Address!"));
    } catch (error) {
       handleError(error, res, next);
    }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.body){
        res.status(400).json(new ApiResponse(400,"BAD_REQUEST",null,"Fields content can not be empty"));
    }
    try {
        const {id}=req.query;
        const validateData=createAddressSchema.parse(req.body);
        const record=await db.update(addressModel).set(validateData).where(eq(addressModel.id,Number(id))).returning();
        if(!record){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"Address not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",record,"Address updated successfully"));

    } catch (error) {
        handleError(error,res,next);
    }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id}=req.query;
        const deletedRecord=await db.delete(addressModel).where(eq(addressModel.id,Number(id))).returning();
        if(!deletedRecord){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,`Address record for ID${id} not found`));
        }
        res.status(200).json(new ApiResponse(200,"DELETED",deletedRecord,`Address record for ID${id} deleted successfully`));
        
    } catch (error) {
        handleError(error,res,next);
        
    }
};