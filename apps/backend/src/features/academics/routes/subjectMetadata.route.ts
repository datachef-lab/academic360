import express from "express";
import { createSubjectMetadata, deleteSubjectMetadata, getAllSubjectMetadatas, getSubjectMetadataById, getSubjectMetadataBySemester, getSubjectMetadataByStreamId, getSubjectMetadataByStreamIdAndSemester, updateSubjectMetadata } from "../controllers/subjectMetadata.controller.ts";


const router = express.Router();

router.post("/", createSubjectMetadata);
router.get("/", getAllSubjectMetadatas);
router.get("/:id",getSubjectMetadataById);
router.get("/stream/:streamId", getSubjectMetadataByStreamId);
router.get("/semester/:semester", getSubjectMetadataBySemester);
router.get("/stream/:streamId/semester/:semester", getSubjectMetadataByStreamIdAndSemester);
router.put("/:id", updateSubjectMetadata);
router.delete("/:id", deleteSubjectMetadata);

export default router;
