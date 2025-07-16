import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { 
    createState, 
    deleteStateRecord, 
    getAllState, 
    getStateById,
    getStatesByCountryId,
    updateStateRecord 
} from "@/features/resources/controllers/state.controller.js";

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

/**
 * State Routes
 * 
 * POST   /                    - Create a new state
 * GET    /                    - Get all states
 * GET    /:id                 - Get state by ID
 * GET    /country/:countryId  - Get states by country ID
 * PUT    /:id                 - Update state by ID
 * DELETE /:id                 - Delete state by ID
 */

// Create a new state
router.post("/", createState);

// Get all states
router.get("/", getAllState);

// Get state by ID
router.get("/:id", getStateById);

// Get states by country ID
router.get("/country/:countryId", getStatesByCountryId);

// Update state by ID
router.put("/:id", updateStateRecord);

// Delete state by ID
router.delete("/:id", deleteStateRecord);

export default router;
