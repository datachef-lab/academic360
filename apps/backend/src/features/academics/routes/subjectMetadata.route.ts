import express from "express";
import { createSubjectMetadata, deleteSubjectMetadata, getAllSubjectMetadatas, getSubjectMetadataById, getSubjectMetadataBySemester, updateSubjectMetadata } from "../controllers/subjectMetadata.controller.ts";

const router = express.Router();

router.post("/", createSubjectMetadata);

router.get("/", getAllSubjectMetadatas);

router.get("/:id", getSubjectMetadataById);

router.get("/semester/:semester", getSubjectMetadataBySemester);

router.put("/:id", updateSubjectMetadata);

router.delete("/:id", deleteSubjectMetadata);


export default router;