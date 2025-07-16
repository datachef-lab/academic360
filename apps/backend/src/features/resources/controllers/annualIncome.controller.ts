import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import { AnnualIncome } from "@/features/resources/models/annualIncome.model.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { 
    findAllAnnualIncomes, 
    findAnnualIncomeById, 
    createAnnualIncome, 
    updateAnnualIncome, 
    deleteAnnualIncome,
    findAnnualIncomeByRange 
} from "@/features/resources/services/annualIncome.service.js";

// Create a new annual income
export const createAnnualIncomeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { range, sequence, disabled } = req.body;

        // Basic validation
        if (!range || typeof range !== 'string') {
            res.status(400).json(new ApiError(400, "Range is required and must be a string"));
            return;
        }

        // Check if range already exists
        const existingRange = await findAnnualIncomeByRange(range);
        if (existingRange) {
            res.status(409).json(new ApiError(409, "Annual income range already exists"));
            return;
        }

        const annualIncomeData = {
            range,
            sequence: sequence || null,
            disabled: disabled || false
        };

        const newAnnualIncome = await createAnnualIncome(annualIncomeData);

        res.status(201).json(
            new ApiResponse(
                201,
                "SUCCESS",
                newAnnualIncome,
                "Annual income created successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all annual incomes
export const getAllAnnualIncomes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const annualIncomes = await findAllAnnualIncomes();

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                annualIncomes,
                "All annual incomes fetched successfully."
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get a specific annual income by ID
export const getAnnualIncomeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        const annualIncome = await findAnnualIncomeById(Number(id));

        if (!annualIncome) {
            res.status(404).json(new ApiError(404, "Annual income not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                annualIncome,
                "Annual income fetched successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update an annual income
export const updateAnnualIncomeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { range, sequence, disabled } = req.body;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if annual income exists
        const existingAnnualIncome = await findAnnualIncomeById(Number(id));
        if (!existingAnnualIncome) {
            res.status(404).json(new ApiError(404, "Annual income not found"));
            return;
        }

        // If range is being updated, check for duplicates
        if (range && range !== existingAnnualIncome.range) {
            const duplicateRange = await findAnnualIncomeByRange(range);
            if (duplicateRange) {
                res.status(409).json(new ApiError(409, "Annual income range already exists"));
                return;
            }
        }

        const updateData: Partial<Omit<AnnualIncome, 'id' | 'createdAt' | 'updatedAt'>> = {};
        
        if (range !== undefined) updateData.range = range;
        if (sequence !== undefined) updateData.sequence = sequence;
        if (disabled !== undefined) updateData.disabled = disabled;

        const updatedAnnualIncome = await updateAnnualIncome(Number(id), updateData);

        if (!updatedAnnualIncome) {
            res.status(404).json(new ApiError(404, "Annual income not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                updatedAnnualIncome,
                "Annual income updated successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete an annual income
export const deleteAnnualIncomeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if annual income exists
        const existingAnnualIncome = await findAnnualIncomeById(Number(id));
        if (!existingAnnualIncome) {
            res.status(404).json(new ApiError(404, "Annual income not found"));
            return;
        }

        const deletedAnnualIncome = await deleteAnnualIncome(Number(id));

        if (!deletedAnnualIncome) {
            res.status(404).json(new ApiError(404, "Annual income not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                deletedAnnualIncome,
                "Annual income deleted successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Legacy function for backward compatibility
export const UpdateAnnualIncome = updateAnnualIncomeController;
