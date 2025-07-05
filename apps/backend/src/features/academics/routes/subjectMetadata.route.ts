import express from "express";
import { createMultipleSubjects, createSubjectMetadata, deleteSubjectMetadata, getAllSubjectMetadatas, getFilteredSubjectMetadatas, getSubjectMetadataById, getSubjectMetadataByClass, getSubjectMetadataByDegreeId, getSubjectMetadataByDegreeIdAndClassId, refactorSubjectIrp, refactorSubjectTypes, updateSubjectMetadata } from "../controllers/subjectMetadata.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";
import { deleteTempFile } from "@/middlewares/deleteTempFile.middleware.js";

const   router = express.Router();

// router.use(verifyJWT);

router.post("/", createSubjectMetadata);

router.get("/", getAllSubjectMetadatas);

router.get("/refactor-types", uploadExcelMiddleware, refactorSubjectTypes);

router.get("/refactor-subject-code", refactorSubjectIrp);

router.post("/filters", getFilteredSubjectMetadatas);

router.post("/upload", uploadExcelMiddleware, createMultipleSubjects);

router.get("/query", (req, res, next) => {
    const { id, degreeId, classId } = req.query;
    console.log(id, degreeId, classId);
    if (classId && degreeId) {
        getSubjectMetadataByDegreeIdAndClassId(req, res, next);
    }
    else if (id) {
        getSubjectMetadataById(req, res, next);
    }
    else if (degreeId) {
        getSubjectMetadataByDegreeId(req, res, next)
    }
    else if (classId) {
        getSubjectMetadataByClass(req, res, next)
    }
    else {
        getAllSubjectMetadatas(req, res, next);
    }
})

router.put("/:id", updateSubjectMetadata);

router.delete("/:id", deleteSubjectMetadata);

export default router;
