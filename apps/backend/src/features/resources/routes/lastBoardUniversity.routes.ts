import express from "express";
import {
  createNewLastBoardUniversity,
  deleteLastBoardUniversity,
  getAllLastBoardUniversity,
  getLastBoardUniversityById,
  updateLastBoardUniversity,
} from "../controllers/lastBoardUniversity.controller.ts";

const router = express.Router();

// Create a new last Board University Route
router.post("/", createNewLastBoardUniversity);

// Get all last Board University Route
router.get("/", getAllLastBoardUniversity);

// Get by last Board University ID
router.get("/:id", getLastBoardUniversityById);

// Update the last Board University Route
router.put("/:id", updateLastBoardUniversity);

//Delete the last Board University Route
router.delete("/:id", deleteLastBoardUniversity);

export default router;
