import express from "express";
import {
    createNewQualification,
    deleteQualifications,
    getAllQualification,
    getQualificationById,
    updateQualification,
} from "@/features/resources/controllers/qualification.controller.js";

const router = express.Router();

// Create a new Qualification Route
router.post("/", createNewQualification);

// Get all Qualification  Route
router.get("/", getAllQualification);

// Get by Qualification ID
router.get("/:id", getQualificationById);

// Update the Qualification  Route
router.put("/:id", updateQualification);

//Delete the Qualification  Route
router.delete("/:id", deleteQualifications);

export default router;
