import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createBatchStudentMappingController,
  getAllBatchStudentMappingsController,
  getBatchStudentMappingByIdController,
  updateBatchStudentMappingController,
  deleteBatchStudentMappingController,
  getBatchStudentMappingsByBatchIdController,
  getBatchStudentMappingsByStudentIdController,
} from "../controllers/batch-student-mapping.controller.js";

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

// CRUD routes
router.post("/", createBatchStudentMappingController);
router.get("/", getAllBatchStudentMappingsController);
router.get("/:id", getBatchStudentMappingByIdController);
router.put("/:id", updateBatchStudentMappingController);
router.delete("/:id", deleteBatchStudentMappingController);

// Specialized routes
router.get("/batch/:batchId", getBatchStudentMappingsByBatchIdController);
router.get("/student/:studentId", getBatchStudentMappingsByStudentIdController);

export default router;
