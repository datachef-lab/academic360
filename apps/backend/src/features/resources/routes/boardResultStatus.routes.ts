import express from "express";
import { 
    createBoardResultStatus, 
    getAllBoardResultStatuses,
    getBoardResultStatusById, 
    updateBoardResultStatus,
    deleteBoardResultStatus
} from "../controllers/boardResultStatus.controller.js";

const router = express.Router();

// Create a new board result status
router.post("/", createBoardResultStatus);

// Get all board result statuses
router.get("/", getAllBoardResultStatuses);

// Get a specific board result status by ID
router.get("/:id", getBoardResultStatusById);

// Update a board result status
router.put("/:id", updateBoardResultStatus);

// Delete a board result status
router.delete("/:id", deleteBoardResultStatus);

export default router;
