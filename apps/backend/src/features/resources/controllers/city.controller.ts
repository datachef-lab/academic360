import { db } from "@/db/index.js";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { cityModel } from "@/features/resources/models/city.model.js";
import { findAll } from "@/utils/helper.js";

// Create a new city
export const createNewCity = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        console.log(req.body);
        const newCityModel = await db.insert(cityModel).values(req.body);
        console.log("New city added", newCityModel);
        res
            .status(201)
            .json(new ApiResponse(201, "SUCCESS", null, "New City is added to db!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all city
export const getAllCity = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const cities = await findAll(cityModel);
        res
            .status(200)
            .json(new ApiResponse(200, "SUCCESS", cities, "Fetched all cities!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get by city ID
export const getCitiesById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        const city = await db
            .select()
            .from(cityModel)
            .where(eq(cityModel.id, Number(id)))
            .limit(1);

        if (!city[0]) {
            res
                .status(404)
                .json(new ApiResponse(404, "NOT_FOUND", null, "city not found"));
            return;
        }

        res
            .status(200)
            .json(new ApiResponse(200, "SUCCESS", city[0], "Fetched city!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update the city
export const updateCity = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const updatedCategory = req.body;

        const existingCategory = await db
            .select()
            .from(cityModel)
            .where(eq(cityModel.id, +id))
            .then((city) => city[0]);

        if (!existingCategory) {
            res.status(404).json(new ApiError(404, "city not found"));
            return;
        }

        const updatedCity = await db
            .update(cityModel)
            .set(updatedCategory)
            .where(eq(cityModel.id, +id))
            .returning();

        if (updateCity.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        updatedCity[0],
                        "city updated successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "city not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};

//Delete the city
export const deleteCity = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const deletedCity = await db
            .delete(cityModel)
            .where(eq(cityModel.id, +id))
            .returning();

        if (deletedCity.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        deletedCity[0],
                        "City deleted successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "City not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};
