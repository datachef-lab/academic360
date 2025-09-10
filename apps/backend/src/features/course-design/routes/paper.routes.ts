import express from "express";
import {
  createPaperHandler,
  getPaperByIdHandler,
  getAllPapersHandler,
  updatePaperHandler,
  deletePaperHandler,
  updatePaperWithComponentsHandler,
  bulkUploadPapersHandler,
} from "../controllers/paper.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = express.Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// Create a new paper
router.post("/", createPaperHandler);

// Bulk upload papers
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadPapersHandler);

// Get a paper by ID
router.get("/:id", getPaperByIdHandler);

// Get all papers
router.get("/", getAllPapersHandler);

// Update a paper
router.put("/:id", updatePaperHandler);

// Update a paper with components
router.put("/:id/with-components", updatePaperWithComponentsHandler);

// Delete a paper
router.delete("/:id", deletePaperHandler);

export default router;
