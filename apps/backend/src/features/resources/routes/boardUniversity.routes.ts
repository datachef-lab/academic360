import express from "express";
import {
    createBoardUniversity,
    getAllBoardUniversity,
    getBoardUniversityById,
    deleteBoardUniversity,
    updateBoardUniversity,
} from "@/features/resources/controllers/boardUniversity.controller.js";

const router = express.Router();

router.post("/", createBoardUniversity);


router.get("/", getAllBoardUniversity);


router.get("/:id", getBoardUniversityById);

// Update the  Board University Route
router.put("/:id", updateBoardUniversity);

//Delete the  Board University Route
router.delete("/:id", deleteBoardUniversity);

export default router;
