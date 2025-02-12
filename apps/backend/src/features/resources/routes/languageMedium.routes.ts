import express from "express";
import {
  createNewLanguageMedium,
  deleteLanguageMedium,
  getAllLanguageMedium,
  getLanguageMediumById,
  updateLanguageMedium,
} from "@/features/resources/controllers/languageMedium.controller.js";

const router = express.Router();

// Create a new Language Medium Route
router.post("/", createNewLanguageMedium);

// Get all Language Medium Route
router.get("/", getAllLanguageMedium);

// Get by Language Medium ID
router.get("/:id", getLanguageMediumById);

// Update the Language Medium Route
router.put("/:id", updateLanguageMedium);

//Delete the Language Medium Route
router.delete("/:id", deleteLanguageMedium);

export default router;
