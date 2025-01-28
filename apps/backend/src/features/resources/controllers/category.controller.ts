import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { categoryModel } from "../models/category.model.ts";
import { ApiError } from "@/utils/ApiError.ts";

// Create a new category
export const createNewCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        console.log(req.body);
        const newCategoryModel = await db.insert(categoryModel).values(req.body);
        console.log("New Category added", newCategoryModel);
        res
            .status(201)
            .json(
                new ApiResponse(201, "SUCCESS", null, "New Category is added to db!"),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all category
export const getAllCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const categories = await db.select().from(categoryModel);
        res
            .status(200)
            .json(
                new ApiResponse(200, "SUCCESS", categories, "Fetched all Categories!"),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get by category ID
export const getCategoryById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        const category = await db
            .select()
            .from(categoryModel)
            .where(eq(categoryModel.id, Number(id)))
            .limit(1);

        if (!category[0]) {
            res
                .status(404)
                .json(new ApiResponse(404, "NOT_FOUND", null, "Category not found"));
            return;
        }

        res
            .status(200)
            .json(new ApiResponse(200, "SUCCESS", category[0], "Fetched Category!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update the category
export const updateCategory = async (
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
            .from(categoryModel)
            .where(eq(categoryModel.id, +id))
            .then((category) => category[0]);

        if (!existingCategory) {
            res.status(404).json(new ApiError(404, "Category not found"));
            return;
        }

        const updatedCategories = await db
            .update(categoryModel)
            .set(updatedCategory)
            .where(eq(categoryModel.id, +id))
            .returning();

        if (updatedCategories.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        updatedCategories[0],
                        "Categories updated successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Categories not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};

//Delete the category
export const deleteCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const deletedCategory = await db
            .delete(categoryModel)
            .where(eq(categoryModel.id, +id))
            .returning();

        if (deletedCategory.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        deletedCategory[0],
                        "Category deleted successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Category not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};
