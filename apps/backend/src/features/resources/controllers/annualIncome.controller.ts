import { handleError } from "@/utils/handleError.js";
import { findAll } from "@/utils/helper.js";
import { NextFunction, Request, Response } from "express";
import { AnnualIncome, annualIncomeModel } from "@/features/resources/models/annualIncome.model.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { db } from "@/db/index";
import { eq } from "drizzle-orm";

export const getAllAnnualIncomes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const annualIncomes = await findAll(annualIncomeModel);

        res.status(200).json(new ApiResponse(200, "SUCCESS", annualIncomes, "Fetched all annual incomes."))
    } catch (error) {
        handleError(error, res, next);
    }
}
export const UpdateAnnualIncome = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
         console.log("body",req.body)
         const {createdAt,updatedAt,...props}=req.body as AnnualIncome
        console.log("id**", id);
        
        const record = await db.update(annualIncomeModel).set(props).where(eq(annualIncomeModel.id, Number(id))).returning();
        if (!record) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "AnnualIncome not found"));
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", record, "AnnualIncome updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};
