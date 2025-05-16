import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createHealth,
  getHealthById,
  getHealthByStudentId,
  updateHealth,
  deleteHealth,
  deleteHealthByStudentId
} from "../controllers/health.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Create health record
router.post("/", createHealth);

// Get health by student ID (must be before generic /:id route)
router.get("/student/:studentId", getHealthByStudentId);

// Get health by ID
router.get("/:id", getHealthById);

// Update health
router.put("/:id", updateHealth);

// Delete health by ID
router.delete("/:id", deleteHealth);

// Delete health by student ID
router.delete("/student/:studentId", deleteHealthByStudentId);

export default router;