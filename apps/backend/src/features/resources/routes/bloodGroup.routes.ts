import express from "express";
import {
  createBloodGroup,
  getAllBloodGroups,
  updateBloodGroup,
  deleteBloodGroup,
  getBloodGroupById,
} from "../controllers/bloodGroup.controller.ts";

const router = express.Router();

// Create a new blood group Route
router.post("/", createBloodGroup);

// Get all blood groups
router.get("/", getAllBloodGroups);

// Get a specific blood group Route
router.get("/:id", getBloodGroupById);

// Update a blood group Route
router.put("/:id", updateBloodGroup);

// Delete a blood group Route
router.delete("/:id", deleteBloodGroup);

export default router;
