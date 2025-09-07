import express from "express";
import {
  createNationality,
  deleteNationality,
  getAllNationality,
  getNationalityById,
  updateNationality,
} from "@/features/resources/controllers/nationality.controller.js";

const router = express.Router();

/**
 * Nationality Routes
 *
 * POST   /                    - Create a new nationality
 * GET    /                    - Get all nationalities
 * GET    /:id                 - Get nationality by ID
 * PUT    /:id                 - Update nationality by ID
 * DELETE /:id                 - Delete nationality by ID
 */

// Create a new nationality
router.post("/", createNationality);

// Get all nationalities
router.get("/", getAllNationality);

// Get nationality by ID
router.get("/:id", getNationalityById);

// Update nationality by ID
router.put("/:id", updateNationality);

// Delete nationality by ID
router.delete("/:id", deleteNationality);

export default router;
