import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createDegree,
  deleteDegree,
  getAllDegree,
  getDegreeById,
  updateDegree,
} from "@/features/resources/controllers/degree.controller.js";

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

// Create a new degree
router.post("/", createDegree);

// Get all degrees
router.get("/", getAllDegree);

// Get a specific degree by ID
router.get("/:id", getDegreeById);

// Update a degree
router.put("/:id", updateDegree);

// Delete a degree
router.delete("/:id", deleteDegree);

export default router;
