import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import { Category } from "@/features/resources/models/category.model.js";
import {
  findAllCategories,
  findCategoryById,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
  findCategoryByName,
  findCategoryByCode,
} from "@/features/resources/services/category.service.js";

// Create a new category
export const createNewCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, documentRequired, code, sequence, disabled } = req.body;

    // Basic validation
    if (!name || typeof name !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Name is required and must be a string"));
      return;
    }

    if (!code || typeof code !== "string") {
      res
        .status(400)
        .json(new ApiError(400, "Code is required and must be a string"));
      return;
    }

    if (code.length > 10) {
      res
        .status(400)
        .json(new ApiError(400, "Code must be less than 10 characters"));
      return;
    }

    // Check if name already exists
    const existingName = await findCategoryByName(name);
    if (existingName) {
      res.status(409).json(new ApiError(409, "Category name already exists"));
      return;
    }

    // Check if code already exists
    const existingCode = await findCategoryByCode(code);
    if (existingCode) {
      res.status(409).json(new ApiError(409, "Category code already exists"));
      return;
    }

    const categoryData = {
      name,
      documentRequired: documentRequired || false,
      code,
      sequence: sequence || null,
      disabled: disabled || false,
    };

    const newCategory = await createCategoryService(categoryData);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newCategory,
          "Category created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all categories
export const getAllCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categories = await findAllCategories();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          categories,
          "All categories fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get category by ID
export const getCategoryById = async (
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

    const category = await findCategoryById(Number(id));

    if (!category) {
      res.status(404).json(new ApiError(404, "Category not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          category,
          "Category fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update category
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, documentRequired, code, sequence, disabled } = req.body;

    if (!id || isNaN(Number(id))) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    // Check if category exists
    const existingCategory = await findCategoryById(Number(id));
    if (!existingCategory) {
      res.status(404).json(new ApiError(404, "Category not found"));
      return;
    }

    // Validate code length if provided
    if (code && code.length > 10) {
      res
        .status(400)
        .json(new ApiError(400, "Code must be less than 10 characters"));
      return;
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingCategory.name) {
      const duplicateName = await findCategoryByName(name);
      if (duplicateName) {
        res.status(409).json(new ApiError(409, "Category name already exists"));
        return;
      }
    }

    // If code is being updated, check for duplicates
    if (code && code !== existingCategory.code) {
      const duplicateCode = await findCategoryByCode(code);
      if (duplicateCode) {
        res.status(409).json(new ApiError(409, "Category code already exists"));
        return;
      }
    }

    const updateData: Partial<
      Omit<Category, "id" | "createdAt" | "updatedAt">
    > = {};

    if (name !== undefined) updateData.name = name;
    if (documentRequired !== undefined)
      updateData.documentRequired = documentRequired;
    if (code !== undefined) updateData.code = code;
    if (sequence !== undefined) updateData.sequence = sequence;
    if (disabled !== undefined) updateData.disabled = disabled;

    const updatedCategory = await updateCategoryService(Number(id), updateData);

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
          "Category updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete category
export const deleteCategory = async (
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

    // Check if category exists
    const existingCategory = await findCategoryById(Number(id));
    if (!existingCategory) {
      res.status(404).json(new ApiError(404, "Category not found"));
      return;
    }

    const deletedCategory = await deleteCategoryService(Number(id));

    if (!deletedCategory) {
      res.status(404).json(new ApiError(404, "Category not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deletedCategory,
          "Category deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
