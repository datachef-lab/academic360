import {db} from "@/db/index.js";
import { eq } from "drizzle-orm";
import {ApiResponse} from "@/utils/ApiResonse.js";
import {handleError} from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import { pickupPointModel } from "@/features/resources/models/pickupPoint.model.js";
import { findAll } from "@/utils/helper.js";


export const createPickupPoint= async (req: Request, res: Response, next: NextFunction) => {
    try{
        const records=await db.insert(pickupPointModel).values(req.body).returning();
        res.status(201).json(new ApiResponse(201,"SUCCESS",records,"New PickupPoint created successfully "))

    }catch (error) {
        handleError(error,res,next);
    }
};

export const getAllPickupPoint = async (req:Request, res:Response, next:NextFunction)=>{
    try{
        const records=await findAll(pickupPointModel);
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "All PickupPoint fetched successfully!"));
    }catch (e) {
        handleError(e,res,next);
    }
};


export const updatePickupPoint=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {id}=req.query;
        console.log("*body*",req.query);
        console.log("id**",id);
        const updatedData = req.body;
        const record=await db.update(pickupPointModel).set(updatedData).where(eq(pickupPointModel.id,Number(id))).returning();
        if(!record){
            res.status(404).json(new ApiResponse(404,"NOT_FOUND",null,"PickupPoint not found"));
        }
        res.status(200).json(new ApiResponse(200,"UPDATED",record,"PickupPoint updated successfully"));

    }catch(error){
        handleError(error,res,next);
    }
};

export const deletePickupPoint=async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {id}=req.query;
        console.log("id**",id);
        const deletedRecord=await db.delete(pickupPointModel).where(eq(pickupPointModel.id,Number(id))).returning();
        if(deletedRecord){
            res.status(200).json(new ApiResponse(200,"Deleted",deletedRecord,"Deleted record successfully"));
        }

    } catch (error) {
        handleError(error,res,next);

    }
};