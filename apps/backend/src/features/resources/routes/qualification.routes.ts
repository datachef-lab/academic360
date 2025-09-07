import express from "express";
import {
  createNewQualification,
  deleteQualifications,
  getAllQualification,
  getQualificationById,
  updateQualification,
} from "@/features/resources/controllers/qualification.controller.js";

const router = express.Router();

/**
 * Qualification Routes
 *
 * POST   /                    - Create a new qualification
 * GET    /                    - Get all qualifications
 * GET    /:id                 - Get qualification by ID
 * PUT    /:id                 - Update qualification by ID
 * DELETE /:id                 - Delete qualification by ID
 */

// Create a new qualification
router.post("/", createNewQualification);

// Get all qualifications
router.get("/", getAllQualification);

// Get qualification by ID
router.get("/:id", getQualificationById);

// Update qualification by ID
router.put("/:id", updateQualification);

// Delete qualification by ID
router.delete("/:id", deleteQualifications);

export default router;
