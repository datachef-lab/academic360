import express from "express";
import {
  createNewCategory,
  deleteCategory,
  getAllCategory,
  getCategoryById,
  updateCategory,
} from "../controllers/category.controller.ts";

const router = express.Router();

// Create a new category Route
router.post("/", createNewCategory);

// Get all category Route
router.get("/", getAllCategory);

// Get by category ID
router.get("/:id", getCategoryById);

// Update the category Route
router.put("/:id", updateCategory);

//Delete the category Route
router.delete("/:id", deleteCategory);

export default router;
