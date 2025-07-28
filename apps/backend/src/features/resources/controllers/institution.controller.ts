import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { Institution } from "@/features/resources/models/institution.model.js";
import { 
    findAllInstitutions,
    findInstitutionById, 
    createInstitution as createInstitutionService,
    updateInstitution as updateInstitutionService,
    deleteInstitution as deleteInstitutionService,
    findInstitutionByName
} from "@/features/resources/services/institution.service.js";

// Create a new institution
export const createNewInstitution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, degreeId, addressId, sequence, disabled } = req.body;

        // Basic validation
        if (!name || typeof name !== 'string') {
            res.status(400).json(new ApiError(400, "Name is required and must be a string"));
            return;
        }

        if (name.length > 700) {
            res.status(400).json(new ApiError(400, "Name must be less than 700 characters"));
            return;
        }

        if (!degreeId || isNaN(Number(degreeId))) {
            res.status(400).json(new ApiError(400, "Valid degree ID is required"));
            return;
        }

        // Check if name already exists
        const existingName = await findInstitutionByName(name);
        if (existingName) {
            res.status(409).json(new ApiError(409, "Institution name already exists"));
            return;
        }

        const institutionData = {
            name,
            degreeId: Number(degreeId),
            addressId: addressId ? Number(addressId) : null,
            sequence: sequence || null,
            disabled: disabled || false
        };

        const newInstitution = await createInstitutionService(institutionData);

        res.status(201).json(
            new ApiResponse(
                201,
                "SUCCESS",
                newInstitution,
                "Institution created successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all institutions
export const getAllInstitution = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const institutions = await findAllInstitutions();
        
        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                institutions,
                "All institutions fetched successfully."
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get institution by ID
export const getInstitutionById = async (
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

        const institution = await findInstitutionById(Number(id));

        if (!institution) {
            res.status(404).json(new ApiError(404, "Institution not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                institution,
                "Institution fetched successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update institution
export const updateInstitution = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, degreeId, addressId, sequence, disabled } = req.body;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if institution exists
        const existingInstitution = await findInstitutionById(Number(id));
        if (!existingInstitution) {
            res.status(404).json(new ApiError(404, "Institution not found"));
            return;
        }

        // Validate name length if provided
        if (name && name.length > 700) {
            res.status(400).json(new ApiError(400, "Name must be less than 700 characters"));
            return;
        }

        // Validate degree ID if provided
        if (degreeId && isNaN(Number(degreeId))) {
            res.status(400).json(new ApiError(400, "Valid degree ID is required"));
            return;
        }

        // If name is being updated, check for duplicates
        if (name && name !== existingInstitution.name) {
            const duplicateName = await findInstitutionByName(name);
            if (duplicateName) {
                res.status(409).json(new ApiError(409, "Institution name already exists"));
                return;
            }
        }

        const updateData: Partial<Omit<Institution, 'id' | 'createdAt' | 'updatedAt'>> = {};
        
        if (name !== undefined) updateData.name = name;
        if (degreeId !== undefined) updateData.degreeId = Number(degreeId);
        if (addressId !== undefined) updateData.addressId = addressId ? Number(addressId) : null;
        if (sequence !== undefined) updateData.sequence = sequence;
        if (disabled !== undefined) updateData.disabled = disabled;

        const updatedInstitution = await updateInstitutionService(Number(id), updateData);

        if (!updatedInstitution) {
            res.status(404).json(new ApiError(404, "Institution not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                updatedInstitution,
                "Institution updated successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete institution
export const deleteInstitutions = async (
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

        // Check if institution exists
        const existingInstitution = await findInstitutionById(Number(id));
        if (!existingInstitution) {
            res.status(404).json(new ApiError(404, "Institution not found"));
            return;
        }

        const deletedInstitution = await deleteInstitutionService(Number(id));

        if (!deletedInstitution) {
            res.status(404).json(new ApiError(404, "Institution not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                deletedInstitution,
                "Institution deleted successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};
