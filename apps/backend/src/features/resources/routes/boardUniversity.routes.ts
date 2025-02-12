import express from "express";
import {
    createBoardUniversity,
    getAllBoardUniversity,
    getBoardUniversityById,
    deleteBoardUniversity,
    updateBoardUniversity,
} from "@/features/resources/controllers/boardUniversity.controller.js";

const router = express.Router();

// Create a new  Board University Route
router.post("/", createBoardUniversity);

// Get all  Board University Route
router.get("/", getAllBoardUniversity);

// Get by  Board University ID
router.get("/:id", getBoardUniversityById);

// Update the  Board University Route
router.put("/:id", updateBoardUniversity);

//Delete the  Board University Route
router.delete("/:id", deleteBoardUniversity);

export default router;
