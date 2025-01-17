import { Router } from "express";
import {
  createSubjectMetadata,
  getAllSubjectMetadatas,
  getSubjectMetadataById,
  getSubjectMetadataByStreamId,
  getSubjectMetadataBySemester,
  getSubjectMetadataByStreamIdAndSemester,
  updateRecordById,
  deleteSubjectMetadata
} from "../controllers/subjectMetadata.controller";
import { subjectMetadataModel } from "../models/subjectMetadata.model";

const router: Router = Router();

// Create a new subject metadata record
router.post("/", createSubjectMetadata);

// Get all subject metadata records
router.get("/", getAllSubjectMetadatas);

// Get subject metadata by ID
router.get("/:id", getSubjectMetadataById);

// Get subject metadata by Stream ID
router.get("/stream/:streamId", getSubjectMetadataByStreamId);

// Get subject metadata by Semester
router.get("/semester/:semester", getSubjectMetadataBySemester);

// Get subject metadata by Stream ID and Semester
router.get("/stream/:streamId/semester/:semester", getSubjectMetadataByStreamIdAndSemester);

// Update a subject metadata record by ID
router.put("/:id", (req, res, next) =>
  updateRecordById(subjectMetadataModel, req, res, next)
);

// Delete a subject metadata record by ID
router.delete("/:id", deleteSubjectMetadata);

export default router;
