import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { BoardUniversity } from "@/features/resources/models/boardUniversity.model.js";
import { 
    findAllBoardUniversities,
    findBoardUniversityById, 
    createBoardUniversity as createBoardUniversityService,
    updateBoardUniversity as updateBoardUniversityService,
    deleteBoardUniversity as deleteBoardUniversityService,
    findBoardUniversityByName,
    findBoardUniversityByCode
} from "@/features/resources/services/boardUniversity.service.js";

// Create a new board university
export const createBoardUniversity = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { name, degreeId, passingMarks, code, addressId, sequence, disabled } = req.body;

        // Basic validation
        if (!name || typeof name !== 'string') {
            res.status(400).json(new ApiError(400, "Name is required and must be a string"));
            return;
        }

        if (name.length > 700) {
            res.status(400).json(new ApiError(400, "Name must be less than 700 characters"));
            return;
        }

        // Check if name already exists
        const existingName = await findBoardUniversityByName(name);
        if (existingName) {
            res.status(409).json(new ApiError(409, "Board university name already exists"));
            return;
        }

        // Check if code already exists (if provided)
        if (code) {
            const existingCode = await findBoardUniversityByCode(code);
            if (existingCode) {
                res.status(409).json(new ApiError(409, "Board university code already exists"));
                return;
            }
        }

        // Validate passing marks if provided
        if (passingMarks !== undefined && (isNaN(passingMarks) || passingMarks < 0 || passingMarks > 100)) {
            res.status(400).json(new ApiError(400, "Passing marks must be a number between 0 and 100"));
            return;
        }

        const boardUniversityData = {
            name,
            degreeId: degreeId || null,
            passingMarks: passingMarks || null,
            code: code || null,
            addressId: addressId || null,
            sequence: sequence || null,
            disabled: disabled || false
        };

        const newBoardUniversity = await createBoardUniversityService(boardUniversityData);

        res.status(201).json(
            new ApiResponse(
                201,
                "SUCCESS",
                newBoardUniversity,
                "Board university created successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all board universities
export const getAllBoardUniversity = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const boardUniversities = await findAllBoardUniversities();
        
        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                boardUniversities,
                "All board universities fetched successfully."
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get board university by ID
export const getBoardUniversityById = async (
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

        const boardUniversity = await findBoardUniversityById(Number(id));

        if (!boardUniversity) {
            res.status(404).json(new ApiError(404, "Board university not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                boardUniversity,
                "Board university fetched successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update board university
export const updateBoardUniversity = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, degreeId, passingMarks, code, addressId, sequence, disabled } = req.body;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if board university exists
        const existingBoardUniversity = await findBoardUniversityById(Number(id));
        if (!existingBoardUniversity) {
            res.status(404).json(new ApiError(404, "Board university not found"));
            return;
        }

        // Validate name length if provided
        if (name && name.length > 700) {
            res.status(400).json(new ApiError(400, "Name must be less than 700 characters"));
            return;
        }

        // If name is being updated, check for duplicates
        if (name && name !== existingBoardUniversity.name) {
            const duplicateName = await findBoardUniversityByName(name);
            if (duplicateName) {
                res.status(409).json(new ApiError(409, "Board university name already exists"));
                return;
            }
        }

        // If code is being updated, check for duplicates
        if (code && code !== existingBoardUniversity.code) {
            const duplicateCode = await findBoardUniversityByCode(code);
            if (duplicateCode) {
                res.status(409).json(new ApiError(409, "Board university code already exists"));
                return;
            }
        }

        // Validate passing marks if provided
        if (passingMarks !== undefined && (isNaN(passingMarks) || passingMarks < 0 || passingMarks > 100)) {
            res.status(400).json(new ApiError(400, "Passing marks must be a number between 0 and 100"));
            return;
        }

        const updateData: Partial<Omit<BoardUniversity, 'id' | 'createdAt' | 'updatedAt'>> = {};
        
        if (name !== undefined) updateData.name = name;
        if (degreeId !== undefined) updateData.degreeId = degreeId;
        if (passingMarks !== undefined) updateData.passingMarks = passingMarks;
        if (code !== undefined) updateData.code = code;
        if (addressId !== undefined) updateData.addressId = addressId;
        if (sequence !== undefined) updateData.sequence = sequence;
        if (disabled !== undefined) updateData.disabled = disabled;

        const updatedBoardUniversity = await updateBoardUniversityService(Number(id), updateData);

        if (!updatedBoardUniversity) {
            res.status(404).json(new ApiError(404, "Board university not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                updatedBoardUniversity,
                "Board university updated successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete board university
export const deleteBoardUniversity = async (
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

        // Check if board university exists
        const existingBoardUniversity = await findBoardUniversityById(Number(id));
        if (!existingBoardUniversity) {
            res.status(404).json(new ApiError(404, "Board university not found"));
            return;
        }

        const deletedBoardUniversity = await deleteBoardUniversityService(Number(id));

        if (!deletedBoardUniversity) {
            res.status(404).json(new ApiError(404, "Board university not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                deletedBoardUniversity,
                "Board university deleted successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};