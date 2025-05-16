import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createFamily,
  getFamilyById,
  getFamilyByStudentId,
  updateFamily,
  deleteFamilyById,
  deleteFamilyByStudentId
} from "../controllers/family.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Create family
router.post("/", createFamily);

// Get family by ID
router.get("/:id", getFamilyById);

// Get family by student ID
router.get("/student/:studentId", getFamilyByStudentId);

// Update family
router.put("/:id", updateFamily);

// Delete family by ID
router.delete("/:id", deleteFamilyById);

// Delete family by student ID
router.delete("/student/:studentId", deleteFamilyByStudentId);

export default router;