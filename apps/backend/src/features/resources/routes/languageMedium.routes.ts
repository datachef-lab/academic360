import express from "express";
import {
  createNewLanguageMedium,
  deleteLanguageMedium,
  getAllLanguageMedium,
  getLanguageMediumById,
  updateLanguageMedium,
} from "@/features/resources/controllers/languageMedium.controller.js";

const router = express.Router();

/**
 * Language Medium Routes
 * 
 * POST   /                    - Create a new language medium
 * GET    /                    - Get all language mediums
 * GET    /:id                 - Get language medium by ID
 * PUT    /:id                 - Update language medium by ID
 * DELETE /:id                 - Delete language medium by ID
 */

// Create a new language medium
router.post("/", createNewLanguageMedium);

// Get all language mediums
router.get("/", getAllLanguageMedium);

// Get language medium by ID
router.get("/:id", getLanguageMediumById);

// Update language medium by ID
router.put("/:id", updateLanguageMedium);

// Delete language medium by ID
router.delete("/:id", deleteLanguageMedium);

export default router;
