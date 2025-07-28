import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { PickupPoint } from "@/features/resources/models/pickupPoint.model.js";
import { 
    findAllPickupPoints,
    findPickupPointById, 
    createPickupPoint as createPickupPointService,
    updatePickupPoint as updatePickupPointService,
    deletePickupPoint as deletePickupPointService,
    findPickupPointByName
} from "@/features/resources/services/pickupPoint.service.js";

// Create a new pickup point
export const createPickupPoint = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { name } = req.body;

        // Basic validation
        if (!name || typeof name !== 'string') {
            res.status(400).json(new ApiError(400, "Name is required and must be a string"));
            return;
        }

        // Check if name already exists
        const existingName = await findPickupPointByName(name);
        if (existingName) {
            res.status(409).json(new ApiError(409, "Pickup point name already exists"));
            return;
        }

        const pickupPointData = {
            name: name.trim()
        };

        const newPickupPoint = await createPickupPointService(pickupPointData);

        res.status(201).json(
            new ApiResponse(
                201,
                "SUCCESS",
                newPickupPoint,
                "Pickup point created successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all pickup points
export const getAllPickupPoint = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const pickupPoints = await findAllPickupPoints();
        
        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                pickupPoints,
                "All pickup points fetched successfully."
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get pickup point by ID
export const getPickupPointById = async (
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

        const pickupPoint = await findPickupPointById(Number(id));

        if (!pickupPoint) {
            res.status(404).json(new ApiError(404, "Pickup point not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                pickupPoint,
                "Pickup point fetched successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update pickup point
export const updatePickupPoint = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if pickup point exists
        const existingPickupPoint = await findPickupPointById(Number(id));
        if (!existingPickupPoint) {
            res.status(404).json(new ApiError(404, "Pickup point not found"));
            return;
        }

        // If name is being updated, check for duplicates
        if (name && name.trim() !== existingPickupPoint.name) {
            const duplicateName = await findPickupPointByName(name);
            if (duplicateName) {
                res.status(409).json(new ApiError(409, "Pickup point name already exists"));
                return;
            }
        }

        const updateData: Partial<Omit<PickupPoint, 'id' | 'createdAt' | 'updatedAt'>> = {};
        
        if (name !== undefined) updateData.name = name.trim();

        const updatedPickupPoint = await updatePickupPointService(Number(id), updateData);

        if (!updatedPickupPoint) {
            res.status(404).json(new ApiError(404, "Pickup point not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                updatedPickupPoint,
                "Pickup point updated successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete pickup point
export const deletePickupPoint = async (
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

        // Check if pickup point exists
        const existingPickupPoint = await findPickupPointById(Number(id));
        if (!existingPickupPoint) {
            res.status(404).json(new ApiError(404, "Pickup point not found"));
            return;
        }

        const deletedPickupPoint = await deletePickupPointService(Number(id));

        if (!deletedPickupPoint) {
            res.status(404).json(new ApiError(404, "Pickup point not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                deletedPickupPoint,
                "Pickup point deleted successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};