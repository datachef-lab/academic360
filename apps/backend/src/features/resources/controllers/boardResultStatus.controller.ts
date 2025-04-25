import { Request, Response, NextFunction } from "express";
import { CreateResultStatus, findBoardResultStatusById } from "../services/boardResultStatus.service";
import { ApiResponse, handleError } from "@/utils";
import { BoardResultStatus, boardResultStatusModel } from "../models/boardResultStatus.model";
import { eq } from "drizzle-orm";
import { db } from "@/db/index";

export const createBoardResultStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const record = await CreateResultStatus(req.body as BoardResultStatus);
        res.status(201).json(new ApiResponse(201, "SUCCESS", record, "New Board Result Status is added to db!"));
    
    } catch (error) {
        handleError(error, res, next);
        
    }
};

export const getBoardResultStatusById = async (req:Request,res:Response,next:NextFunction) => {
    try {
        const {id}=req.query;
        const record = await findBoardResultStatusById(Number(id));
        if(!record){
          res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, ` Board Result Status of ID${id}  not found`));
          return;
        }
        
        res.status(200).json(new ApiResponse(200, "SUCCESS", record, "Fetched Board Result Status successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};
// asdw
export const updateBoardResultStatus = async (req:Request,res:Response,next:NextFunction) => {
    try {
        const {id}=req.params;
         console.log("body",req.body);
                const {createdAt,updatedAt,...props}=req.body as BoardResultStatus
        
        
                const updatedEmergencyContact = await db.update(boardResultStatusModel).set({...props}).where(eq(boardResultStatusModel.id, Number(id))).returning();
        
                if (!updatedEmergencyContact) {
                    res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Emergency Contact not found"));
                }
                res.status(200).json(new ApiResponse(200, "UPDATED", updatedEmergencyContact, "Emergency Contact updated successfully"));
        
            } catch (error) {
                handleError(error, res, next);
            }
};