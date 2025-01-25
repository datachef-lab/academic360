import express from "express";
import {
  createNewLastInstitution,
  deleteLastInstitutions,
  getAllLastInstitution,
  getLastInstitutionById,
  updateLastInstitution,
} from "../controllers/lastInstitution.controller.ts";

const router = express.Router();

// Create a new last Institutions Route
router.post("/", createNewLastInstitution);

// Get all last Institutions  Route
router.get("/", getAllLastInstitution);

// Get by last Institutions ID
router.get("/:id", getLastInstitutionById);

// Update the last Institutions  Route
router.put("/:id", updateLastInstitution);

//Delete the last Institutions  Route
router.delete("/:id", deleteLastInstitutions);

export default router;
