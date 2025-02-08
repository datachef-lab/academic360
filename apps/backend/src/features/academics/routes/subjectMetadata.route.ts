import express from "express";
import { createSubjectMetadata, deleteSubjectMetadata, getAllSubjectMetadatas, getSubjectMetadataById, getSubjectMetadataBySemester, getSubjectMetadataByStreamId, getSubjectMetadataByStreamIdAndSemester, updateSubjectMetadata } from "../controllers/subjectMetadata.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createSubjectMetadata);

router.get("/", getAllSubjectMetadatas, );

router.get("/query", (req, res, next) => {
    const { id, streamId, semester } = req.query;
    console.log(id, streamId, semester);
    if (semester && streamId) {
        getSubjectMetadataByStreamIdAndSemester(req, res, next);
    }
    else if (id) {
        getSubjectMetadataById(req, res, next);
    }
    else if (streamId) {
        getSubjectMetadataByStreamId(req, res, next)
    }
    else if (semester) {
        getSubjectMetadataBySemester(req, res, next)
    }
    else {
        getAllSubjectMetadatas(req, res, next);
    }
})

router.put("/:id", updateSubjectMetadata);

router.delete("/:id", deleteSubjectMetadata);

export default router;
