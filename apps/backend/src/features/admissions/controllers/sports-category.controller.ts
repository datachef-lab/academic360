import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createSportCategory,
  getSportCategoryById,
  getAllSportCategories,
  updateSportCategory,
  deleteSportCategory
} from "../services/sports-category.service";

export const createSportsCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createSportCategory(req.body);
    res.status(201).json(new ApiResponse(201, "SUCCESS", result, "Sports category created successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getSportsCategoryByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getSportCategoryById(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Sports category with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Sports category fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllSportsCategoriesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getAllSportCategories();
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Sports categories fetched successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateSportsCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await updateSportCategory(Number(req.params.id), req.body);
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Sports category with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", result, `Sports category with ID ${req.params.id} updated successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteSportsCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteSportCategory(Number(req.params.id));
    if (!result) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Sports category with ID ${req.params.id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", { success: result }, `Sports category with ID ${req.params.id} deleted successfully!`));
  } catch (error) {
    handleError(error, res, next);
  }
}; 