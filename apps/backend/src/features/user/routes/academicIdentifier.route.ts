import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createAcademicIdentifier,
  getAcademicIdentifierById,
  getAcademicIdentifierByStudentId,
  updateAcademicIdentifier,
  deleteAcademicIdentifier,
  deleteAcademicIdentifierByStudentId,
  getAllAcademicIdentifiersController
} from "../controllers/academicIdentifier.controller.js";

const router = express.Router();

// router.use(verifyJWT);

// Get all
router.get("/", getAllAcademicIdentifiersController);
// Create
router.post("/", createAcademicIdentifier);
// Get by id
router.get("/:id", getAcademicIdentifierById);
// Get by studentId
router.get("/student/:studentId", getAcademicIdentifierByStudentId);
// Update
router.put("/:id", updateAcademicIdentifier);
// Delete by id
router.delete("/:id", deleteAcademicIdentifier);
// Delete by studentId
router.delete("/student/:studentId", deleteAcademicIdentifierByStudentId);

export default router;