
import express from "express";
import {
    createOccupation, deleteOccupation,
    getAllOccupation,
    getOccupationById,
    updateOccupation
} from "@/features/resources/controllers/occupation.controller.js";

const router = express.Router();


router.post("/", createOccupation);
router.get("/", getAllOccupation);
router.get("/:id", getOccupationById);
router.put("/", updateOccupation);
router.delete("/", deleteOccupation);

export default router;
