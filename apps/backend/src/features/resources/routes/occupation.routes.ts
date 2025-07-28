import express from "express";
import {
    createOccupation,
    deleteOccupation,
    getAllOccupation,
    getOccupationById,
    updateOccupation
} from "@/features/resources/controllers/occupation.controller.js";

const router = express.Router();

/**
 * Occupation Routes
 * 
 * POST   /                    - Create a new occupation
 * GET    /                    - Get all occupations
 * GET    /:id                 - Get occupation by ID
 * PUT    /:id                 - Update occupation by ID
 * DELETE /:id                 - Delete occupation by ID
 */

// Create a new occupation
router.post("/", createOccupation);

// Get all occupations
router.get("/", getAllOccupation);

// Get occupation by ID
router.get("/:id", getOccupationById);

// Update occupation by ID
router.put("/:id", updateOccupation);

// Delete occupation by ID
router.delete("/:id", deleteOccupation);

export default router;
