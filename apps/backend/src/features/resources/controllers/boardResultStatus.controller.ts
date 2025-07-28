import { Request, Response, NextFunction } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { BoardResultStatus } from "../models/boardResultStatus.model.js";
import { 
    findAllBoardResultStatuses,
    findBoardResultStatusById, 
    createBoardResultStatus as createBoardResultStatusService,
    updateBoardResultStatus as updateBoardResultStatusService,
    deleteBoardResultStatus as deleteBoardResultStatusService,
    findBoardResultStatusByName,
    CreateResultStatus as CreateResultStatusLegacy
} from "../services/boardResultStatus.service.js";

// Create a new board result status
export const createBoardResultStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, spclType, result, sequence, disabled } = req.body;

        // Basic validation
        if (!name || typeof name !== 'string') {
            res.status(400).json(new ApiError(400, "Name is required and must be a string"));
            return;
        }

        if (!spclType || typeof spclType !== 'string') {
            res.status(400).json(new ApiError(400, "Special type is required and must be a string"));
            return;
        }

        if (result && !['FAIL', 'PASS'].includes(result)) {
            res.status(400).json(new ApiError(400, "Result must be either 'FAIL' or 'PASS'"));
            return;
        }

        // Check if name already exists
        const existingName = await findBoardResultStatusByName(name);
        if (existingName) {
            res.status(409).json(new ApiError(409, "Board result status name already exists"));
            return;
        }

        const boardResultStatusData = {
            name,
            spclType,
            result: result || null,
            sequence: sequence || null,
            disabled: disabled || false
        };

        const newBoardResultStatus = await createBoardResultStatusService(boardResultStatusData);

        res.status(201).json(
            new ApiResponse(
                201,
                "SUCCESS",
                newBoardResultStatus,
                "Board result status created successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all board result statuses
export const getAllBoardResultStatuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const boardResultStatuses = await findAllBoardResultStatuses();
        
        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                boardResultStatuses,
                "All board result statuses fetched successfully."
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get a specific board result status by ID
export const getBoardResultStatusById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        const boardResultStatus = await findBoardResultStatusById(Number(id));

        if (!boardResultStatus) {
            res.status(404).json(new ApiError(404, "Board result status not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                boardResultStatus,
                "Board result status fetched successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update a board result status
export const updateBoardResultStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, spclType, result, sequence, disabled } = req.body;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if board result status exists
        const existingBoardResultStatus = await findBoardResultStatusById(Number(id));
        if (!existingBoardResultStatus) {
            res.status(404).json(new ApiError(404, "Board result status not found"));
            return;
        }

        // Validate result enum if provided
        if (result && !['FAIL', 'PASS'].includes(result)) {
            res.status(400).json(new ApiError(400, "Result must be either 'FAIL' or 'PASS'"));
            return;
        }

        // If name is being updated, check for duplicates
        if (name && name !== existingBoardResultStatus.name) {
            const duplicateName = await findBoardResultStatusByName(name);
            if (duplicateName) {
                res.status(409).json(new ApiError(409, "Board result status name already exists"));
                return;
            }
        }

        const updateData: Partial<Omit<BoardResultStatus, 'id' | 'createdAt' | 'updatedAt'>> = {};
        
        if (name !== undefined) updateData.name = name;
        if (spclType !== undefined) updateData.spclType = spclType;
        if (result !== undefined) updateData.result = result;
        if (sequence !== undefined) updateData.sequence = sequence;
        if (disabled !== undefined) updateData.disabled = disabled;

        const updatedBoardResultStatus = await updateBoardResultStatusService(Number(id), updateData);

        if (!updatedBoardResultStatus) {
            res.status(404).json(new ApiError(404, "Board result status not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                updatedBoardResultStatus,
                "Board result status updated successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete a board result status
export const deleteBoardResultStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if board result status exists
        const existingBoardResultStatus = await findBoardResultStatusById(Number(id));
        if (!existingBoardResultStatus) {
            res.status(404).json(new ApiError(404, "Board result status not found"));
            return;
        }

        const deletedBoardResultStatus = await deleteBoardResultStatusService(Number(id));

        if (!deletedBoardResultStatus) {
            res.status(404).json(new ApiError(404, "Board result status not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                deletedBoardResultStatus,
                "Board result status deleted successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};