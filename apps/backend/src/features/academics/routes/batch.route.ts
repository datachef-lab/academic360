import { verifyJWT } from "@/middlewares/index.js";
import express from "express";
import {
  oldBatches,
  refactorBatchSessionC,
  createBatchController,
  getAllBatchesController,
  getBatchByIdController,
  updateBatchController,
  deleteBatchController,
  batchUploadController,
  getBatchSummariesController,
  getBatchDetailsByIdController
} from "../controllers/batch.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = express.Router();

// router.use(verifyJWT);

// CRUD routes
router.post("/", createBatchController);
router.get("/summaries", getBatchSummariesController);
router.get("/", getAllBatchesController);
router.get("/:id", getBatchByIdController);
router.get("/:id/details", getBatchDetailsByIdController);
router.put("/:id", updateBatchController);
router.delete("/:id", deleteBatchController);

// Excel upload routeclear
router.post("/upload-excel", uploadExcelMiddleware, batchUploadController);

// Migration/refactor routes
router.get("/old", oldBatches);
router.get("/refactorBatchSession", refactorBatchSessionC);

export default router;