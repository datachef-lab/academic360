import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { categoryModel } from "../models/category.model.ts";
import { ApiError } from "@/utils/ApiError.ts";
import { findAll } from "@/utils/helper.ts";
import {
  addCategory,
  findCategoryId,
  removeCategory,
  saveCategory,
} from "../services/category.service.ts";

// Create a new category
export const createNewCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const newCategoryModel = await addCategory(req.body);
    console.log(newCategoryModel);
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
    const categories = await findAll(categoryModel);
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

    const foundCategory = await findCategoryId(+id);

    if (!foundCategory) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Category not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", foundCategory, "Fetched Category!"),
      );
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
    const { type } = req.body;

    const updatedCategory = await saveCategory(+id, type);

    if (!updatedCategory) {
      res.status(404).json(new ApiError(404, "Category not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedCategory,
          " updated Category successfully!",
        ),
      );
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

    const isDeleted = await removeCategory(+id);

    if (isDeleted) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            true,
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
