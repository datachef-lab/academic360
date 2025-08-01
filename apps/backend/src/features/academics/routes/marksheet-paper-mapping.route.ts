import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createMarksheetPaperMappingController,
  getAllMarksheetPaperMappingsController,
  getMarksheetPaperMappingByIdController,
  updateMarksheetPaperMappingController,
  deleteMarksheetPaperMappingController,
  getMarksheetPaperMappingsByMarksheetIdController,
} from "../controllers/marksheet-paper-mapping.controller.js";

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

// CRUD routes
router.post("/", createMarksheetPaperMappingController);
router.get("/", getAllMarksheetPaperMappingsController);
router.get("/:id", getMarksheetPaperMappingByIdController);
router.put("/:id", updateMarksheetPaperMappingController);
router.delete("/:id", deleteMarksheetPaperMappingController);

// Specialized routes
router.get(
  "/marksheet/:marksheetId",
  getMarksheetPaperMappingsByMarksheetIdController,
);

export default router;
