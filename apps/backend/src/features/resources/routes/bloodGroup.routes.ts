import express from "express";
import {
  createBloodGroup,
  getAllBloodGroups,
  getBloodGroup,
  updateBloodGroup,
  deleteBloodGroup,
} from "@/features/resources/controllers/bloodGroup.controller.js";

const router = express.Router();

// Create a new blood group
router.post("/", createBloodGroup);

// Get all blood groups
router.get("/", getAllBloodGroups);

// Get a specific blood group by ID
router.get("/:id", getBloodGroup);

// Update a blood group
router.put("/:id", updateBloodGroup);

// Delete a blood group
router.delete("/:id", deleteBloodGroup);

export default router;
