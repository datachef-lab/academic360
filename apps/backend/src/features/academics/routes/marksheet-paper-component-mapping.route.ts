import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createMarksheetPaperComponentMappingController,
  getAllMarksheetPaperComponentMappingsController,
  getMarksheetPaperComponentMappingByIdController,
  updateMarksheetPaperComponentMappingController,
  deleteMarksheetPaperComponentMappingController,
  getMarksheetPaperComponentMappingsByMarksheetPaperMappingIdController,
} from "../controllers/marksheet-paper-component-mapping.controller.js";

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

// CRUD routes
router.post("/", createMarksheetPaperComponentMappingController);
router.get("/", getAllMarksheetPaperComponentMappingsController);
router.get("/:id", getMarksheetPaperComponentMappingByIdController);
router.put("/:id", updateMarksheetPaperComponentMappingController);
router.delete("/:id", deleteMarksheetPaperComponentMappingController);

// Specialized routes
router.get(
  "/marksheet-paper/:marksheetPaperMappingId",
  getMarksheetPaperComponentMappingsByMarksheetPaperMappingIdController,
);

export default router;
