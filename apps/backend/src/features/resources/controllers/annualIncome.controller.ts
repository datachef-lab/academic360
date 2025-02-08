import { handleError } from "@/utils/handleError.js";
import { findAll } from "@/utils/helper.js";
import { NextFunction, Request, Response } from "express";
import { annualIncomeModel } from "../models/annualIncome.model.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

export const getAllAnnualIncomes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const annualIncomes = await findAll(annualIncomeModel);

        res.status(200).json(new ApiResponse(200, "SUCCESS", annualIncomes, "Fetched all annual incomes."))
    } catch (error) {
        handleError(error, res, next);
    }
}