import { verifyJWT } from "@/middlewares/index.js";
import express from "express";
import {
  oldBatchesPapers,
  createBatchPaperController,
  getAllBatchPapersController,
  getBatchPaperByIdController,
  updateBatchPaperController,
  deleteBatchPaperController
} from "../controllers/batchPaper.controller.js";

const router = express.Router();

// router.use(verifyJWT);

// CRUD routes
router.post("/", createBatchPaperController);
router.get("/", getAllBatchPapersController);
router.get("/:id", getBatchPaperByIdController);
router.put("/:id", updateBatchPaperController);
router.delete("/:id", deleteBatchPaperController);

// Migration route
router.get("/old", oldBatchesPapers);

export default router;