import express from "express";
import { createSubjectMetadata, getAllSubjectMetadatas } from "../controllers/subjectMetadata.controller.ts";

const router = express.Router();

router.post("/", createSubjectMetadata);

router.get("/", getAllSubjectMetadatas);


export default router;