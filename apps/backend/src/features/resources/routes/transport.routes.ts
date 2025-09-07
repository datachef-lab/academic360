import express from "express";
import {
  createNewTransport,
  deleteTransport,
  getAllTransport,
  getTransportById,
  getTransportsByMode,
  updateTransport,
} from "@/features/resources/controllers/transport.controller.js";

const router = express.Router();

/**
 * Transport Routes
 *
 * POST   /                    - Create a new transport
 * GET    /                    - Get all transports
 * GET    /:id                 - Get transport by ID
 * GET    /mode/:mode          - Get transports by mode
 * PUT    /:id                 - Update transport by ID
 * DELETE /:id                 - Delete transport by ID
 */

// Create a new transport
router.post("/", createNewTransport);

// Get all transports
router.get("/", getAllTransport);

// Get transport by ID
router.get("/:id", getTransportById);

// Get transports by mode
router.get("/mode/:mode", getTransportsByMode);

// Update transport by ID
router.put("/:id", updateTransport);

// Delete transport by ID
router.delete("/:id", deleteTransport);

export default router;
