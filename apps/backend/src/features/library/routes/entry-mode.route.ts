import express from "express";
import {
  createEntryModeController,
  deleteEntryModeController,
  getAllEntryModesController,
  getEntryModeByIdController,
  updateEntryModeController,
} from "@/features/library/controllers/entry-mode.controller.js";

const router = express.Router();

router.post("/", createEntryModeController);
router.get("/", getAllEntryModesController);
router.get("/:id", getEntryModeByIdController);
router.put("/:id", updateEntryModeController);
router.delete("/:id", deleteEntryModeController);

export default router;
