import express from "express";
import {
  createPaperHandler,
  getPaperByIdHandler,
  getAllPapersHandler,
  updatePaperHandler,
  deletePaperHandler,
  updatePaperWithComponentsHandler,
  downloadPapersHandler,
} from "../controllers/paper.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = express.Router();

// Download papers (must be before /:id route)
router.get("/download", downloadPapersHandler);

// Apply JWT verification to all routes
router.use(verifyJWT);

// Create a new paper
router.post("/", createPaperHandler);

// Bulk upload papers
// router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadPapersHandler);

// Test download endpoint
router.get("/test-download", (req, res) => {
  res.json({
    message: "Download endpoint is working",
    timestamp: new Date().toISOString(),
  });
});

// Get all papers
router.get("/", getAllPapersHandler);

// Get a paper by ID
router.get("/:id", getPaperByIdHandler);

// Update a paper
router.put("/:id", updatePaperHandler);

// Update a paper with components
router.put("/:id/with-components", updatePaperWithComponentsHandler);

// Delete a paper
router.delete("/:id", deletePaperHandler);

export default router;
