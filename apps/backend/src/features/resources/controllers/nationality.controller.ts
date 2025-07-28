import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { Nationality } from "@/features/resources/models/nationality.model.js";
import { 
    findAllNationalities,
    findNationalityById, 
    createNationality as createNationalityService,
    updateNationality as updateNationalityService,
    deleteNationality as deleteNationalityService,
    findNationalityByName
} from "@/features/resources/services/nationality.service.js";

// Create a new nationality
export const createNationality = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { name, code, sequence, disabled } = req.body;

        // Basic validation
        if (!name || typeof name !== 'string') {
            res.status(400).json(new ApiError(400, "Name is required and must be a string"));
            return;
        }

        // Check if name already exists (case-insensitive)
        const existingName = await findNationalityByName(name);
        if (existingName) {
            res.status(409).json(new ApiError(409, "Nationality name already exists"));
            return;
        }

        const nationalityData = {
            name: name.toUpperCase().trim(),
            code: code || null,
            sequence: sequence || null,
            disabled: disabled || false
        };

        const newNationality = await createNationalityService(nationalityData);

        res.status(201).json(
            new ApiResponse(
                201,
                "SUCCESS",
                newNationality,
                "Nationality created successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all nationalities
export const getAllNationality = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const nationalities = await findAllNationalities();
        
        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                nationalities,
                "All nationalities fetched successfully."
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get nationality by ID
export const getNationalityById = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        const nationality = await findNationalityById(Number(id));

        if (!nationality) {
            res.status(404).json(new ApiError(404, "Nationality not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                nationality,
                "Nationality fetched successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update nationality
export const updateNationality = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, code, sequence, disabled } = req.body;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if nationality exists
        const existingNationality = await findNationalityById(Number(id));
        if (!existingNationality) {
            res.status(404).json(new ApiError(404, "Nationality not found"));
            return;
        }

        // If name is being updated, check for duplicates (case-insensitive)
        if (name && name.toUpperCase().trim() !== existingNationality.name) {
            const duplicateName = await findNationalityByName(name);
            if (duplicateName) {
                res.status(409).json(new ApiError(409, "Nationality name already exists"));
                return;
            }
        }

        const updateData: Partial<Omit<Nationality, 'id' | 'createdAt' | 'updatedAt'>> = {};
        
        if (name !== undefined) updateData.name = name.toUpperCase().trim();
        if (code !== undefined) updateData.code = code;
        if (sequence !== undefined) updateData.sequence = sequence;
        if (disabled !== undefined) updateData.disabled = disabled;

        const updatedNationality = await updateNationalityService(Number(id), updateData);

        if (!updatedNationality) {
            res.status(404).json(new ApiError(404, "Nationality not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                updatedNationality,
                "Nationality updated successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete nationality
export const deleteNationality = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if nationality exists
        const existingNationality = await findNationalityById(Number(id));
        if (!existingNationality) {
            res.status(404).json(new ApiError(404, "Nationality not found"));
            return;
        }

        const deletedNationality = await deleteNationalityService(Number(id));

        if (!deletedNationality) {
            res.status(404).json(new ApiError(404, "Nationality not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                deletedNationality,
                "Nationality deleted successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};
