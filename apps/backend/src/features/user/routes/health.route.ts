import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createHealth,
  getHealthById,
  getHealthByStudentId,
  updateHealth,
  deleteHealth,
  deleteHealthByStudentId,
  getAllHealthsController
} from "../controllers/health.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Get all
router.get("/", getAllHealthsController);
// Create
router.post("/", createHealth);
// Get by id
router.get("/:id", getHealthById);
// Get by studentId
router.get("/student/:studentId", getHealthByStudentId);
// Update
router.put("/:id", updateHealth);
// Delete by id
router.delete("/:id", deleteHealth);
// Delete by studentId
router.delete("/student/:studentId", deleteHealthByStudentId);

export default router;