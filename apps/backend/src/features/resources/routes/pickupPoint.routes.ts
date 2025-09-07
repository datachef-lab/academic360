import express from "express";
import {
  createPickupPoint,
  deletePickupPoint,
  getAllPickupPoint,
  getPickupPointById,
  updatePickupPoint,
} from "@/features/resources/controllers/pickupPoint.controller.js";

const router = express.Router();

/**
 * Pickup Point Routes
 *
 * POST   /                    - Create a new pickup point
 * GET    /                    - Get all pickup points
 * GET    /:id                 - Get pickup point by ID
 * PUT    /:id                 - Update pickup point by ID
 * DELETE /:id                 - Delete pickup point by ID
 */

// Create a new pickup point
router.post("/", createPickupPoint);

// Get all pickup points
router.get("/", getAllPickupPoint);

// Get pickup point by ID
router.get("/:id", getPickupPointById);

// Update pickup point by ID
router.put("/:id", updatePickupPoint);

// Delete pickup point by ID
router.delete("/:id", deletePickupPoint);

export default router;
