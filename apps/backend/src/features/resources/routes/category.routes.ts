import express from "express";
import {
  createNewCategory,
  deleteCategory,
  getAllCategory,
  getCategoryById,
  updateCategory,
} from "@/features/resources/controllers/category.controller.js";

const router = express.Router();

// Create a new category
router.post("/", createNewCategory);

// Get all categories
router.get("/", getAllCategory);

// Get a specific category by ID
router.get("/:id", getCategoryById);

// Update a category
router.put("/:id", updateCategory);

// Delete a category
router.delete("/:id", deleteCategory);

export default router;
