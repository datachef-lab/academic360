import express from "express";

import {
    createReligion,
    deleteReligionRecord,
    getAllReligion,
    getReligionById,
    updateReligionRecord,
} from "@/features/resources/controllers/religion.controller.js";

const router = express.Router();

/**
 * Religion Routes
 * 
 * POST   /                    - Create a new religion
 * GET    /                    - Get all religions
 * GET    /:id                 - Get religion by ID
 * PUT    /:id                 - Update religion by ID
 * DELETE /:id                 - Delete religion by ID
 */

// Create a new religion
router.post("/", createReligion);

// Get all religions
router.get("/", getAllReligion);

// Get religion by ID
router.get("/:id", getReligionById);

// Update religion by ID
router.put("/:id", updateReligionRecord);

// Delete religion by ID
router.delete("/:id", deleteReligionRecord);

export default router;
