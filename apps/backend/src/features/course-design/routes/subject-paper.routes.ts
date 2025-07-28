import { Router } from "express";
import {
  createSubjectPaperController,
  getAllSubjectPapersController,
  getSubjectPaperByIdController,
  updateSubjectPaperController,
  deleteSubjectPaperController,
  getSubjectPapersWithPapersController,
  bulkUploadSubjectPapersController,
} from "../controllers/subject-paper.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

// Create a new subject paper
router.post("/", createSubjectPaperController);

// Get all subject papers
router.get("/", getAllSubjectPapersController);

// Get subject papers with papers data
router.get("/with-papers", getSubjectPapersWithPapersController);

// Bulk upload subject papers
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadSubjectPapersController);

// Get subject paper by ID
router.get("/:id", getSubjectPaperByIdController);

// Update subject paper
router.put("/:id", updateSubjectPaperController);

// Delete subject paper
router.delete("/:id", deleteSubjectPaperController);

export default router; 