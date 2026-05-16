import express from "express";
import {
  createSeriesController,
  deleteSeriesController,
  getAllSeriesController,
  getSeriesByIdController,
  updateSeriesController,
} from "@/features/library/controllers/series.controller.js";

const router = express.Router();

router.post("/", createSeriesController);
router.get("/", getAllSeriesController);
router.get("/:id", getSeriesByIdController);
router.put("/:id", updateSeriesController);
router.delete("/:id", deleteSeriesController);

export default router;
