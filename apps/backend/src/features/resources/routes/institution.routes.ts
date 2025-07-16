import express from "express";
import { 
    createNewInstitution, 
    deleteInstitutions, 
    getAllInstitution, 
    getInstitutionById, 
    updateInstitution 
} from "@/features/resources/controllers/institution.controller.js";

const router = express.Router();

// Create a new institution
router.post("/", createNewInstitution);

// Get all institutions
router.get("/", getAllInstitution);

// Get a specific institution by ID
router.get("/:id", getInstitutionById);

// Update an institution
router.put("/:id", updateInstitution);

// Delete an institution
router.delete("/:id", deleteInstitutions);

export default router;
