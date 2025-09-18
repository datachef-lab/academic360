import { Router } from "express";
import {
  createSubjectController,
  getAllSubjectsController,
  getSubjectsPaginatedController,
  getSubjectByIdController,
  getActiveSubjectsController,
  updateSubjectController,
  deleteSubjectController,
  bulkUploadSubjectsController,
} from "../controllers/subject.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

// Create a new subject
router.post("/", createSubjectController);

// Get all subjects
router.get("/", getAllSubjectsController);

// Get paginated subjects
router.get("/paginated", getSubjectsPaginatedController);

// Get active subjects (for dropdowns)
router.get("/active", getActiveSubjectsController);

// Get subject by ID
router.get("/:id", getSubjectByIdController);

// Update subject by ID
router.put("/:id", updateSubjectController);

// Delete subject by ID
router.delete("/:id", deleteSubjectController);

// Bulk upload subjects
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadSubjectsController,
);

export default router;
