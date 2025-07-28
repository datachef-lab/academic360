import express from "express";
import {
    createBoardUniversity,
    getAllBoardUniversity,
    getBoardUniversityById,
    deleteBoardUniversity,
    updateBoardUniversity,
} from "@/features/resources/controllers/boardUniversity.controller.js";

const router = express.Router();

// Create a new board university
router.post("/", createBoardUniversity);

// Get all board universities
router.get("/", getAllBoardUniversity);

// Get a specific board university by ID
router.get("/:id", getBoardUniversityById);

// Update a board university
router.put("/:id", updateBoardUniversity);

// Delete a board university
router.delete("/:id", deleteBoardUniversity);

export default router;
