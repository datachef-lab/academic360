import express from "express";
import { createSubjectMetadata, deleteSubjectMetadata, getAllSubjectMetadatas, getSubjectMetadataById, getSubjectMetadataBySemester, getSubjectMetadataByStreamId, getSubjectMetadataByStreamIdAndSemester, updateSubjectMetadata } from "../controllers/subjectMetadata.controller.ts";

const router = express.Router();

router.post("/", createSubjectMetadata);

router.get("/", getAllSubjectMetadatas);

router.get("/:id", getSubjectMetadataById);

router.get("/query", (req, res, next) => {
    const { id, semester, streamId } = req.query;
    if (id) {
        return getSubjectMetadataById(req, res, next);
    }
    else if (semester && streamId) {
        return getSubjectMetadataByStreamIdAndSemester(req, res, next);
    }
    else if (streamId) {
        return getSubjectMetadataByStreamId(req, res, next);
    }
    else if (semester) {
        return getSubjectMetadataBySemester(req, res, next);
    }
    else {
        return getAllSubjectMetadatas(req, res, next);
    }
});

router.put("/:id", updateSubjectMetadata);

router.delete("/:id", deleteSubjectMetadata);


export default router;