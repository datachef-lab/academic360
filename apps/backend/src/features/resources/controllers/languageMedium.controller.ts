import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { LanguageMedium } from "@/features/resources/models/languageMedium.model.js";
import { 
    findAllLanguageMediums,
    findLanguageMediumById, 
    createLanguageMedium as createLanguageMediumService,
    updateLanguageMedium as updateLanguageMediumService,
    deleteLanguageMedium as deleteLanguageMediumService,
    findLanguageMediumByName
} from "@/features/resources/services/languageMedium.service.js";

// Create a new language medium
export const createNewLanguageMedium = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { name, sequence, disabled } = req.body;

        // Basic validation
        if (!name || typeof name !== 'string') {
            res.status(400).json(new ApiError(400, "Name is required and must be a string"));
            return;
        }

        // Check if name already exists (case-insensitive)
        const existingName = await findLanguageMediumByName(name);
        if (existingName) {
            res.status(409).json(new ApiError(409, "Language medium name already exists"));
            return;
        }

        const languageMediumData = {
            name: name.toUpperCase().trim(),
            sequence: sequence || null,
            disabled: disabled || false
        };

        const newLanguageMedium = await createLanguageMediumService(languageMediumData);

        res.status(201).json(
            new ApiResponse(
                201,
                "SUCCESS",
                newLanguageMedium,
                "Language medium created successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all language mediums
export const getAllLanguageMedium = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const languageMediums = await findAllLanguageMediums();
        
        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                languageMediums,
                "All language mediums fetched successfully."
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get language medium by ID
export const getLanguageMediumById = async (
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

        const languageMedium = await findLanguageMediumById(Number(id));

        if (!languageMedium) {
            res.status(404).json(new ApiError(404, "Language medium not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                languageMedium,
                "Language medium fetched successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update language medium
export const updateLanguageMedium = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, sequence, disabled } = req.body;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if language medium exists
        const existingLanguageMedium = await findLanguageMediumById(Number(id));
        if (!existingLanguageMedium) {
            res.status(404).json(new ApiError(404, "Language medium not found"));
            return;
        }

        // If name is being updated, check for duplicates (case-insensitive)
        if (name && name.toUpperCase().trim() !== existingLanguageMedium.name) {
            const duplicateName = await findLanguageMediumByName(name);
            if (duplicateName) {
                res.status(409).json(new ApiError(409, "Language medium name already exists"));
                return;
            }
        }

        const updateData: Partial<Omit<LanguageMedium, 'id' | 'createdAt' | 'updatedAt'>> = {};
        
        if (name !== undefined) updateData.name = name.toUpperCase().trim();
        if (sequence !== undefined) updateData.sequence = sequence;
        if (disabled !== undefined) updateData.disabled = disabled;

        const updatedLanguageMedium = await updateLanguageMediumService(Number(id), updateData);

        if (!updatedLanguageMedium) {
            res.status(404).json(new ApiError(404, "Language medium not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                updatedLanguageMedium,
                "Language medium updated successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete language medium
export const deleteLanguageMedium = async (
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

        // Check if language medium exists
        const existingLanguageMedium = await findLanguageMediumById(Number(id));
        if (!existingLanguageMedium) {
            res.status(404).json(new ApiError(404, "Language medium not found"));
            return;
        }

        const deletedLanguageMedium = await deleteLanguageMediumService(Number(id));

        if (!deletedLanguageMedium) {
            res.status(404).json(new ApiError(404, "Language medium not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                deletedLanguageMedium,
                "Language medium deleted successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};