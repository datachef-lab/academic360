import express from "express";
import { createNewInstitution, deleteInstitutions, getAllInstitution, getInstitutionById, updateInstitution } from "@/features/resources/controllers/institution.controller.js";


const router = express.Router();

// Create a new  Institutions Route
router.post("/", createNewInstitution);

// Get all  Institutions  Route
router.get("/", getAllInstitution);

// Get by  Institutions ID
router.get("/:id", getInstitutionById);

// Update the  Institutions  Route
router.put("/:id", updateInstitution);

//Delete the  Institutions  Route
router.delete("/:id", deleteInstitutions);

export default router;
