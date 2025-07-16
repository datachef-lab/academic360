import { NextFunction, Response, Request } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { Country } from "@/features/resources/models/country.model.js";
import { 
    findAllCountries,
    findCountryById, 
    createCountry as createCountryService,
    updateCountry as updateCountryService,
    deleteCountry as deleteCountryService,
    findCountryByName
} from "@/features/resources/services/country.service.js";

// Create a new country
export const createCountry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, sequence, disabled } = req.body;

        // Basic validation
        if (!name || typeof name !== 'string') {
            res.status(400).json(new ApiError(400, "Name is required and must be a string"));
            return;
        }

        // Check if name already exists
        const existingName = await findCountryByName(name);
        if (existingName) {
            res.status(409).json(new ApiError(409, "Country name already exists"));
            return;
        }

        const countryData = {
            name,
            sequence: sequence || null,
            disabled: disabled || false
        };

        const newCountry = await createCountryService(countryData);

        res.status(201).json(
            new ApiResponse(
                201,
                "SUCCESS",
                newCountry,
                "Country created successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all countries
export const getAllCountry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const countries = await findAllCountries();
        
        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                countries,
                "All countries fetched successfully."
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get country by ID
export const getCountryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        const country = await findCountryById(Number(id));

        if (!country) {
            res.status(404).json(new ApiError(404, "Country not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                country,
                "Country fetched successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update country
export const updateCountryRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, sequence, disabled } = req.body;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if country exists
        const existingCountry = await findCountryById(Number(id));
        if (!existingCountry) {
            res.status(404).json(new ApiError(404, "Country not found"));
            return;
        }

        // If name is being updated, check for duplicates
        if (name && name !== existingCountry.name) {
            const duplicateName = await findCountryByName(name);
            if (duplicateName) {
                res.status(409).json(new ApiError(409, "Country name already exists"));
                return;
            }
        }

        const updateData: Partial<Omit<Country, 'id' | 'createdAt' | 'updatedAt'>> = {};
        
        if (name !== undefined) updateData.name = name;
        if (sequence !== undefined) updateData.sequence = sequence;
        if (disabled !== undefined) updateData.disabled = disabled;

        const updatedCountry = await updateCountryService(Number(id), updateData);

        if (!updatedCountry) {
            res.status(404).json(new ApiError(404, "Country not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                updatedCountry,
                "Country updated successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete country
export const deleteCountryRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            res.status(400).json(new ApiError(400, "Valid ID is required"));
            return;
        }

        // Check if country exists
        const existingCountry = await findCountryById(Number(id));
        if (!existingCountry) {
            res.status(404).json(new ApiError(404, "Country not found"));
            return;
        }

        const deletedCountry = await deleteCountryService(Number(id));

        if (!deletedCountry) {
            res.status(404).json(new ApiError(404, "Country not found"));
            return;
        }

        res.status(200).json(
            new ApiResponse(
                200,
                "SUCCESS",
                deletedCountry,
                "Country deleted successfully!"
            )
        );
    } catch (error) {
        handleError(error, res, next);
    }
};