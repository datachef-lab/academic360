import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createFamily,
  getFamilyById,
  getFamilyByStudentId,
  updateFamily,
  deleteFamilyById,
  deleteFamilyByStudentId,
  getAllFamiliesController,
} from "../controllers/family.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Get all
router.get("/", getAllFamiliesController);
// Create
router.post("/", createFamily);
// Get by id
router.get("/:id", getFamilyById);
// Get by studentId
router.get("/student/:studentId", getFamilyByStudentId);
// Update
router.put("/:id", updateFamily);
// Delete by id
router.delete("/:id", deleteFamilyById);
// Delete by studentId
router.delete("/student/:studentId", deleteFamilyByStudentId);

export default router;
