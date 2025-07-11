import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createEmergencyContact,
  getEmergencyContactById,
  getEmergencyContactByStudentId,
  updateEmergencyContact,
  deleteEmergencyContact,
  deleteEmergencyContactByStudentId,
  getAllEmergencyContactsController
} from "../controllers/emergencyContact.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Get all
router.get("/", getAllEmergencyContactsController);
// Create
router.post("/", createEmergencyContact);
// Get by id
router.get("/:id", getEmergencyContactById);
// Get by studentId
router.get("/student/:studentId", getEmergencyContactByStudentId);
// Update
router.put("/:id", updateEmergencyContact);
// Delete by id
router.delete("/:id", deleteEmergencyContact);
// Delete by studentId
router.delete("/student/:studentId", deleteEmergencyContactByStudentId);

export default router;