
import express from "express";
import {
    createOccupation, deleteOccupation,
    getAllOccupation,
    updateOccupation
} from "@/features/resources/controllers/occupation.controller.js";

const router = express.Router();


router.post("/", createOccupation);
router.get("/", getAllOccupation);
router.put("/", updateOccupation);
router.delete("/", deleteOccupation);

export default router;
