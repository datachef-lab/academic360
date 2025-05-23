import express from "express";
import {
  createNewCategory,
  deleteCategory,
  getAllCategory,
  getCategoryById,
  updateCategory,
} from "@/features/resources/controllers/category.controller.js";

const router = express.Router();

// Create a new category Route
router.post("/", createNewCategory);

// Get all category Route
router.get("/", getAllCategory);

router.get("/:id", getCategoryById);

// Update the category Route
router.put("/:id", updateCategory);

//Delete the category Route
router.delete("/:id", deleteCategory);

export default router;
