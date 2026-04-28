import express from "express";
import {
  createLibraryPeriodController,
  deleteLibraryPeriodController,
  getAllLibraryPeriodsController,
  getLibraryPeriodByIdController,
  updateLibraryPeriodController,
} from "@/features/library/controllers/library-period.controller.js";

const router = express.Router();

router.post("/", createLibraryPeriodController);
router.get("/", getAllLibraryPeriodsController);
router.get("/:id", getLibraryPeriodByIdController);
router.put("/:id", updateLibraryPeriodController);
router.delete("/:id", deleteLibraryPeriodController);

export default router;
