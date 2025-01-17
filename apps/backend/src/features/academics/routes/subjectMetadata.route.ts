import express from "express";
import { createSubjectMetadata, deleteSubjectMetadata, getAllSubjectMetadatas, getSubjectMetadataById, getSubjectMetadataBySemester, updateSubjectMetadata } from "../controllers/subjectMetadata.controller.ts";

const router = express.Router();

router.post("/", createSubjectMetadata);

router.get("/", getAllSubjectMetadatas);

router.get("/:id", getSubjectMetadataById);

router.get("/query", (req, res, next) => {
    const { id, semester } = req.query;

    if (id) {
        return getSubjectMetadataById(req, res, next);
    } else if (semester) {
        return getSubjectMetadataBySemester(req, res, next);
    }
    else {
        return getAllSubjectMetadatas(req, res, next);
    }
});

router.put("/:id", updateSubjectMetadata);

router.delete("/:id", deleteSubjectMetadata);


export default router;